package com.capstone.be.config;

import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync //Enable Async in Entire Application
@Slf4j
public class AsyncConfig implements AsyncConfigurer {

  @Override
  public Executor getAsyncExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(5); // Increased from 2 to handle more concurrent uploads
    executor.setMaxPoolSize(20); // Increased from 10 to handle burst uploads
    executor.setQueueCapacity(200); // Increased from 100 to queue more requests
    executor.setThreadNamePrefix("Async-");
    executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy()); // Run in caller thread if queue full
    // Configure thread cleanup: threads beyond core pool size will be terminated after 60 seconds of inactivity
    executor.setKeepAliveSeconds(60); // Release threads after 60s of inactivity (default is 60, but explicit is better)
    executor.setWaitForTasksToCompleteOnShutdown(true); // Wait for tasks to complete on shutdown
    executor.setAwaitTerminationSeconds(30); // Wait max 30s for tasks to complete on shutdown
    executor.initialize();
    log.info("Async executor initialized: core={}, max={}, queue={}, keepAlive={}s", 
        executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity(), executor.getKeepAliveSeconds());
    return executor;
  }

  /**
   * Separate executor for audit logging to avoid blocking email operations
   */
  @org.springframework.context.annotation.Bean(name = "auditLogExecutor")
  public Executor auditLogExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(5);
    executor.setQueueCapacity(200);
    executor.setThreadNamePrefix("AuditLog-");
    executor.initialize();
    return executor;
  }

  @Override
  public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
    return (ex, method, params) ->
        log.error("Async error in {}: {}", method.getName(), ex.getMessage(), ex);
  }
}
