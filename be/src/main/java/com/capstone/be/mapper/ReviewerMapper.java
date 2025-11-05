package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.Reviewer;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.dto.request.auth.RegisterReviewerInfo;
import com.capstone.be.dto.response.auth.RegisterReviewerResponse;
import java.util.Set;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ReviewerMapper {

  Reviewer toReviewer(RegisterReviewerInfo info,
      Set<Domain> domains,
      Set<Specialization> reviewSpecializations);

  RegisterReviewerResponse toRegisterReviewerResponse(Reviewer reviewer,
      Set<String> domainNames,
      Set<String> reviewSpecializationNames);

}
