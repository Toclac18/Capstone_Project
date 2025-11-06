package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.response.auth.RegisterReaderResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ReaderMapper {

  RegisterReaderResponse toRegisterResponse(Reader reader);

  Reader toReader(RegisterReaderRequest request);
}
