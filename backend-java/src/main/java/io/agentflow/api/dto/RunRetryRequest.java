package io.agentflow.api.dto;

public class RunRetryRequest {

    private Integer checkpointIndex;

    public Integer getCheckpointIndex() {
        return checkpointIndex;
    }

    public void setCheckpointIndex(Integer checkpointIndex) {
        this.checkpointIndex = checkpointIndex;
    }
}
