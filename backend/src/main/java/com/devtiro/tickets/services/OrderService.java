package com.devtiro.tickets.services;

import com.devtiro.tickets.domain.CreateOrderRequest;
import com.devtiro.tickets.domain.entities.Order;
import java.util.UUID;

public interface OrderService {
  Order createOrder(UUID userId, CreateOrderRequest request);
}
