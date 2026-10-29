package com.capstone.be.service;

import com.capstone.be.dto.response.statistics.BusinessAdminDashboardResponse;
import com.capstone.be.dto.response.statistics.GlobalDocumentStatisticsResponse;
import com.capstone.be.dto.response.statistics.ReportHandlingStatisticsResponse;
import java.time.Instant;

/**
 * Thống kê người dùng: tăng trưởng, phân bố theo vai trò và trạng thái.
 *
 * <p>Tách khỏi BusinessAdminStatisticsService: lớp đó gộp 6 nhóm thống kê không liên
 * quan nhau, và phép đo cho thấy KHÔNG một phương thức riêng nào được dùng chung giữa
 * hai nhóm — mỗi nhóm sở hữu trọn bộ helper của nó.
 */
public interface BaUserStatisticsService {

  com.capstone.be.dto.response.statistics.UserStatisticsResponse getUserStatistics(Instant startDate, Instant endDate);
}
