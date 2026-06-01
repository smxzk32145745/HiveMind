package io.agentflow.api.service;

public class RunConflictException extends RuntimeException {

    public RunConflictException(String message) {
        super(message);
    }
}
