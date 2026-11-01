"""
Kiểm tra đầu vào của `/process-document` và xác thực API key.

Chạy qua `TestClient` thật: stub lib ML, và thay queue manager bằng bản giả
nên không có worker nào chạy và không model nào được nạp.
"""
import pytest
from fastapi.testclient import TestClient

from tests.test_api_contract import _stub_ml_libs

_stub_ml_libs()

from src.api import dependencies, document_router as router_module  # noqa: E402
from src.app import app  # noqa: E402

MAX_BYTES = 10 * 1024 * 1024


class FakeQueueManager:
    """Chỉ cần đủ cho endpoint submit: nhận job, trả id, báo trạng thái."""

    def __init__(self):
        self.queue = type("Q", (), {"qsize": lambda self: 0})()
        self.jobs: dict[str, dict] = {}
        self.submitted: list[tuple[str, str, str | None]] = []

    async def submit_job(self, file_path, filename, callback_url=None):
        job_id = f"job-{len(self.submitted)}"
        self.submitted.append((file_path, filename, callback_url))
        self.jobs[job_id] = {"job_id": job_id, "status": "pending"}
        return job_id

    async def get_job_status(self, job_id):
        return self.jobs.get(job_id)


# TestClient mất ~1s khi đóng (teardown của anyio portal), nên dựng một lần
# cho cả module thay vì mỗi test: 24 test x 1s = 24s chỉ để đóng client.
@pytest.fixture(scope="module")
def _fake_queue():
    fake = FakeQueueManager()
    original = router_module.get_queue_manager
    router_module.get_queue_manager = lambda: fake
    try:
        yield fake
    finally:
        router_module.get_queue_manager = original


@pytest.fixture(scope="module")
def _client(_fake_queue):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def queue(_fake_queue):
    """Trạng thái sạch cho từng test."""
    _fake_queue.submitted.clear()
    _fake_queue.jobs.clear()
    return _fake_queue


@pytest.fixture
def client(_client, queue):
    return _client


def upload(client, name: str, content: bytes, **params):
    return client.post(
        "/api/v1/process-document",
        files={"file": (name, content, "application/pdf")},
        params=params,
    )


class TestDinhDangVaKichThuoc:
    def test_pdf_hop_le_duoc_nhan(self, client, queue):
        response = upload(client, "a.pdf", b"%PDF-1.4 noi dung")
        assert response.status_code == 200
        assert response.json()["job_id"] == "job-0"
        assert len(queue.submitted) == 1

    def test_docx_cung_duoc_nhan(self, client):
        assert upload(client, "a.docx", b"PK\x03\x04 gia").status_code == 200

    @pytest.mark.parametrize("name", ["a.txt", "a.exe", "a", "a.pdf.exe"])
    def test_dinh_dang_khac_bi_tu_choi(self, client, name, queue):
        response = upload(client, name, b"noi dung")
        assert response.status_code == 400
        assert "PDF or DOCX" in response.json()["detail"]
        assert queue.submitted == []

    def test_file_rong_bi_tu_choi(self, client, queue):
        response = upload(client, "a.pdf", b"")
        assert response.status_code == 400
        assert response.json()["detail"] == "File is empty"
        assert queue.submitted == []

    def test_qua_gioi_han_tra_413_va_khong_vao_queue(self, client, queue):
        # Regression: trước đây `content = await file.read()` nạp TOÀN BỘ body
        # vào RAM rồi mới kiểm `len(content)`, nên request 2GB làm hết RAM dù
        # giới hạn chỉ 10MB.
        response = upload(client, "a.pdf", b"x" * (MAX_BYTES + 1))
        assert response.status_code == 413
        assert "10MB" in response.json()["detail"]
        assert queue.submitted == []

    def test_dung_sat_gioi_han_van_duoc_nhan(self, client):
        assert upload(client, "a.pdf", b"x" * MAX_BYTES).status_code == 200

    def test_khong_de_lai_file_tam_khi_bi_tu_choi(self, client, tmp_path, monkeypatch):
        import tempfile

        monkeypatch.setattr(tempfile, "tempdir", str(tmp_path))
        upload(client, "a.pdf", b"x" * (MAX_BYTES + 1))
        upload(client, "a.pdf", b"")
        upload(client, "a.pdf", b"%PDF ok", callback_url="ftp://evil")
        assert list(tmp_path.iterdir()) == []


class TestCallbackUrl:
    @pytest.mark.parametrize(
        "url", ["http://localhost:8080/api/v1/ai/webhook", "https://be/hook"]
    )
    def test_http_va_https_duoc_nhan(self, client, queue, url):
        assert upload(client, "a.pdf", b"%PDF ok", callback_url=url).status_code == 200
        assert queue.submitted[-1][2] == url

    @pytest.mark.parametrize("url", ["ftp://x/y", "file:///etc/passwd", "evil.com"])
    def test_scheme_khac_bi_tu_choi(self, client, queue, url):
        response = upload(client, "a.pdf", b"%PDF ok", callback_url=url)
        assert response.status_code == 400
        assert "HTTP/HTTPS" in response.json()["detail"]
        assert queue.submitted == []

    def test_khong_co_callback_url_van_duoc(self, client, queue):
        assert upload(client, "a.pdf", b"%PDF ok").status_code == 200
        assert queue.submitted[-1][2] is None


class TestVerifyApiKey:
    def test_chua_cau_hinh_thi_mo(self, monkeypatch):
        monkeypatch.setattr(dependencies, "API_KEY", None)
        assert dependencies.verify_api_key(None) is True
        assert dependencies.verify_api_key("gì cũng được") is True

    def test_da_cau_hinh_thi_thieu_header_bi_401(self, monkeypatch):
        from fastapi import HTTPException

        monkeypatch.setattr(dependencies, "API_KEY", "khoa-dung")
        with pytest.raises(HTTPException) as exc:
            dependencies.verify_api_key(None)
        assert exc.value.status_code == 401

    @pytest.mark.parametrize(
        "sent", ["khoa-sai", "", "khoa-dun", "khoa-dungX", "KHOA-DUNG"]
    )
    def test_khoa_sai_bi_401(self, monkeypatch, sent):
        from fastapi import HTTPException

        monkeypatch.setattr(dependencies, "API_KEY", "khoa-dung")
        with pytest.raises(HTTPException) as exc:
            dependencies.verify_api_key(sent)
        assert exc.value.status_code == 401

    def test_khoa_dung_thi_qua(self, monkeypatch):
        monkeypatch.setattr(dependencies, "API_KEY", "khoa-dung")
        assert dependencies.verify_api_key("khoa-dung") is True
