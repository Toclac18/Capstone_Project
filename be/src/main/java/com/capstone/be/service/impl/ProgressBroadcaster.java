package com.capstone.be.service.impl;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class ProgressBroadcaster {

  private final Map<String, CopyOnWriteArraySet<SseEmitter>> emitters = new ConcurrentHashMap<>();

  public SseEmitter subscribe(String jobId) {
    SseEmitter emitter = new SseEmitter(0L); // never timeout (đã có heartbeat)
    emitters.computeIfAbsent(jobId, k -> new CopyOnWriteArraySet<>()).add(emitter);

    emitter.onCompletion(() -> off(jobId, emitter));
    emitter.onTimeout(() -> off(jobId, emitter));
    emitter.onError(e -> off(jobId, emitter));

    // gửi ping ban đầu để giữ kết nối
    send(jobId, "hello", Map.of("message", "subscribed", "jobId", jobId));
    return emitter;
  }

  public void send(String jobId, String event, Object data) {
    var set = emitters.get(jobId);
    if (set == null) {
      return;
    }
    for (SseEmitter em : set) {
      try {
        em.send(SseEmitter.event().name(event).data(data));
      } catch (IOException e) {
        off(jobId, em);
      }
    }
  }

  public void complete(String jobId) {
    var set = emitters.remove(jobId);
    if (set == null) {
      return;
    }
    for (SseEmitter em : set) {
      try {
        em.send(SseEmitter.event().name("complete").data(Map.of("done", true)));
      } catch (IOException ignored) {
      } finally {
        em.complete();
      }
    }
  }

  private void off(String jobId, SseEmitter emitter) {
    var set = emitters.get(jobId);
    if (set != null) {
      set.remove(emitter);
      if (set.isEmpty()) {
        emitters.remove(jobId);
      }
    }
  }
}