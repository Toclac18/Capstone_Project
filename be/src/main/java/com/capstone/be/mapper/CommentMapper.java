package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Comment;
import com.capstone.be.dto.response.comment.CommentResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CommentMapper {

    @Mapping(source = "document.id", target = "documentId")
    @Mapping(source = "user.id", target = "user.id")
    @Mapping(source = "user.fullName", target = "user.fullName")
    @Mapping(source = "user.avatarKey", target = "user.avatarUrl")
    CommentResponse toResponse(Comment comment);
}
