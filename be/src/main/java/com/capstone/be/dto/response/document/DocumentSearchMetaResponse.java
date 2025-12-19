package com.capstone.be.dto.response.document;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Metadata cho màn search public documents (Filter Modal)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSearchMetaResponse {

    private List<OrganizationOption> organizations;
    private List<DomainOption> domains;
    private List<SpecializationOption> specializations;
    private List<DocTypeOption> docTypes;
    private List<TagOption> tags;

    /** Danh sách năm (để fill dropdown From/To) */
    private List<Integer> years;

    /** Range point/price cho slider lọc Premium */
    private RangeDto priceRange;

    /** Danh sách organization IDs mà user đã join (chỉ có khi authenticated) */
    private List<UUID> joinedOrganizationIds;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrganizationOption {
        private UUID id;
        private String name;
        private String logoUrl;
        private Long docCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DomainOption {
        private UUID id;
        private int code;
        private String name;
        private Long docCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpecializationOption {
        private UUID id;
        private int code;
        private String name;
        private UUID domainId;
        private Long docCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocTypeOption {
        private UUID id;
        private int code;
        private String name;
        private Long docCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TagOption {
        private UUID id;
        private String name;
        private Long docCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RangeDto {
        private Integer min;
        private Integer max;
    }
}
