package com.devtiro.tickets.controllers;

import static com.devtiro.tickets.util.JwtUtil.parseUserId;

import com.devtiro.tickets.domain.CreateOrderRequest;
import com.devtiro.tickets.domain.dtos.CreateOrderRequestDto;
import com.devtiro.tickets.domain.dtos.CreateOrderResponseDto;
import com.devtiro.tickets.domain.entities.Order;
import com.devtiro.tickets.mappers.OrderMapper;
import com.devtiro.tickets.services.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

  private final OrderService orderService;
  private final OrderMapper orderMapper;

  @Value("${razorpay.key.id}")
  private String razorpayKeyId;

  @PostMapping
  public ResponseEntity<CreateOrderResponseDto> createOrder(
      @AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody CreateOrderRequestDto requestDto
  ) {
    CreateOrderRequest request = orderMapper.fromDto(requestDto);
    Order order = orderService.createOrder(parseUserId(jwt), request);
    CreateOrderResponseDto responseDto = orderMapper.toCreateOrderResponseDto(order);
    responseDto.setRazorpayKeyId(razorpayKeyId);

    return new ResponseEntity<>(responseDto, HttpStatus.CREATED);
  }
}
