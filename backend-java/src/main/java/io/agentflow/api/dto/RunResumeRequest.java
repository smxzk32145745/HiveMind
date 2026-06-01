package io.agentflow.api.dto;

import java.util.HashMap;
import java.util.Map;

public class RunResumeRequest {

    private Map<String, Object> input = new HashMap<>();

    public Map<String, Object> getInput() {
        return input;
    }

    public void setInput(Map<String, Object> input) {
        this.input = input == null ? new HashMap<>() : input;
    }
}
