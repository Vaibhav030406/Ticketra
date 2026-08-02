package com.devtiro.tickets.mappers;

import com.devtiro.tickets.domain.CreateOrderRequest;
import com.devtiro.tickets.domain.dtos.CreateOrderRequestDto;
import com.devtiro.tickets.domain.dtos.CreateOrderResponseDto;
import com.devtiro.tickets.domain.entities.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OrderMapper {

  CreateOrderRequest fromDto(CreateOrderRequestDto dto);

  // razorpayKeyId is intentionally left unmapped here (no source field on
  // Order) — the service/controller sets it after mapping, since it comes
  // from config rather than the entity. unmappedTargetPolicy = IGNORE means
  // MapStruct won't fail the build over it, but it also means we must not
  // forget to set it before returning this DTO to the client.
  @Mapping(target = "ticketTypeId", source = "ticketType.id")
  CreateOrderResponseDto toCreateOrderResponseDto(Order order);
}
