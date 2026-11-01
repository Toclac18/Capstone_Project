# Flyway migrations

## Quy ước

`V<số>__<mô_tả>.sql` — số tăng dần, không sửa file đã merge. Sửa schema thì thêm file mới.

## Vì sao chưa có V1

`V1` được **dành cho baseline schema** sinh từ database thật, và chưa thể tạo trong PR này:
schema hiện tại do `ddl-auto=update` sinh ra qua nhiều tháng, nên **không** suy ngược được
từ entity — hai thứ đã lệch nhau. Sinh baseline từ entity rồi gọi nó là "schema hiện tại"
chính là tạo ra đúng loại trôi dạt mà Flyway phải ngăn.

Chạy `be/scripts/generate-baseline.sh` trên DB thật để tạo `V1__baseline.sql`, rồi commit nó.

## Cơ chế chuyển đổi (an toàn với DB đang chạy)

`baseline-on-migrate: true` + `baseline-version: 1`:

| Tình huống | Flyway làm gì |
|---|---|
| DB đã có dữ liệu (prod, local của team) | Đóng dấu baseline = 1, **không chạm schema cũ**, rồi áp dụng V2+ |
| DB rỗng (CI, dev mới) | Áp dụng mọi migration có sẵn từ đầu |

Vì các DB hiện có đã được đóng dấu ở version 1, khi `V1__baseline.sql` được thêm vào sau
thì chúng **bỏ qua** nó (Flyway bỏ qua version ≤ baseline). Chỉ DB mới mới chạy V1.

## Trạng thái hiện tại

`ddl-auto` vẫn là `update` ở dev/prod — **có chủ đích**. Đổi sang `validate` là PR riêng,
làm sau khi `V1__baseline.sql` đã tồn tại và đã kiểm trên bản sao của prod. Đổi sớm hơn thì
app sẽ không khởi động được ở bất kỳ chỗ nào schema lệch entity.
