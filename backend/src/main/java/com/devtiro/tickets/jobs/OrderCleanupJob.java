package com.devtiro.tickets.jobs;

import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import com.devtiro.tickets.repositories.OrderRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderCleanupJob {

  private final OrderRepository orderRepository;

  @Scheduled(cron = "0 * * * * *") // Run every minute
  public void cleanExpiredOrders() {
    LocalDateTime now = LocalDateTime.now();
    int updatedCount = orderRepository.updateStatusForExpiredOrders(
        OrderStatusEnum.PENDING,
        OrderStatusEnum.EXPIRED,
        now
    );
    if (updatedCount > 0) {
      log.info("Expired {} pending orders past their expiration time.", updatedCount);
    }
  }
}
