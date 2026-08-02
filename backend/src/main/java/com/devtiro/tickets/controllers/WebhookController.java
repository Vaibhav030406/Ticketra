package com.devtiro.tickets.controllers;

import com.devtiro.tickets.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/webhooks")
@RequiredArgsConstructor
public class WebhookController {

  private final OrderService orderService;

  // Raw String body, not a parsed DTO: signature verification needs the
  // exact bytes Razorpay sent, not a reserialized JSON representation of
  // them, which could differ in whitespace/key order and break the HMAC
  // check.
  @PostMapping(path = "/razorpay")
  public ResponseEntity<Void> handleRazorpayWebhook(
      @RequestBody String rawPayload,
      @RequestHeader("X-Razorpay-Signature") String signature
  ) {
    orderService.handleRazorpayWebhook(rawPayload, signature);
    return ResponseEntity.ok().build();
  }
}
