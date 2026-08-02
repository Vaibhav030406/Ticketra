package com.devtiro.tickets.repositories;

import com.devtiro.tickets.domain.entities.Order;
import com.devtiro.tickets.domain.entities.OrderStatusEnum;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

  boolean existsByIdempotencyKey(String idempotencyKey);

  @Query("SELECT COALESCE(SUM(o.quantity), 0) FROM CustomerOrder o WHERE o.ticketType.id = :ticketTypeId AND o.status = :status AND o.expiresAt > :now")
  int sumQuantityByTicketTypeIdAndStatusAndExpiresAtAfter(
      @Param("ticketTypeId") UUID ticketTypeId,
      @Param("status") OrderStatusEnum status,
      @Param("now") LocalDateTime now
  );
}
