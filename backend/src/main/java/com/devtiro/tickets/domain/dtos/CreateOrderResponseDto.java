package com.devtiro.tickets.domain.dtos;

import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateOrderResponseDto {

  private UUID id;
  private UUID ticketTypeId;
  private Integer quantity;
  private Double unitPrice;
  private Double totalAmount;
  private OrderStatusEnum status;

  // Needed by the frontend to open Razorpay Checkout against this order.
  private String razorpayOrderId;

  // Razorpay's public key id — not stored on the Order entity itself, set
  // separately by OrderService/controller from config, since it's the same
  // value for every order rather than something per-order to persist.
  private String razorpayKeyId;

  private LocalDateTime expiresAt;
  private LocalDateTime createdAt;
}
