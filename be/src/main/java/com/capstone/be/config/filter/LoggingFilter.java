package com.capstone.be.config.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public class LoggingFilter implements Filter {

    @Override
    public void doFilter(
            ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) servletRequest;
        HttpServletResponse httpResponse = (HttpServletResponse) servletResponse;

        long startTime = System.currentTimeMillis();
        filterChain.doFilter(servletRequest, servletResponse);
        long duration = System.currentTimeMillis() - startTime;

        System.out.println(
                "Request : "
                        + httpRequest.getMethod()
                        + " "
                        + httpRequest.getRequestURL()
                        + " done in "
                        + duration
                        + "ms with code "
                        + httpResponse.getStatus());
    }
}
