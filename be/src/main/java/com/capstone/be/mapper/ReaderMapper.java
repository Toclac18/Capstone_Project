package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.dto.request.auth.ReaderRegisterRequest;
import com.capstone.be.dto.response.auth.ReaderRegisterResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ReaderMapper {

    ReaderRegisterResponse toRegisterResponse(Reader reader);

    Reader toReader(ReaderRegisterRequest request);
}
