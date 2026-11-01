package com.capstone.be.service;

import java.time.Instant;

/**
 * Thống kê tổ chức toàn hệ thống.
 *
 * <p>Tách khỏi BusinessAdminStatisticsService: lớp đó gộp 6 nhóm thống kê không liên
 * quan nhau, và phép đo cho thấy KHÔNG một phương thức riêng nào được dùng chung giữa
 * hai nhóm — mỗi nhóm sở hữu trọn bộ helper của nó.
 */
public interface BaOrganizationStatisticsService {

  com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse getGlobalOrganizationStatistics(Instant startDate, Instant endDate);
}
