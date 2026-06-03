package io.agentflow.api.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RunStatusConverterTest {

    private final RunStatusConverter converter = new RunStatusConverter();

    @Test
    void persistsLowercaseWireValuesMatchingPython() {
        assertThat(converter.convertToDatabaseColumn(RunStatus.PENDING)).isEqualTo("pending");
        assertThat(converter.convertToDatabaseColumn(RunStatus.WAITING_HUMAN))
                .isEqualTo("waiting_human");
        assertThat(converter.convertToDatabaseColumn(RunStatus.SUCCEEDED)).isEqualTo("succeeded");
    }

    @Test
    void readsLowercaseWireValuesWrittenByPythonWorker() {
        assertThat(converter.convertToEntityAttribute("running")).isEqualTo(RunStatus.RUNNING);
        assertThat(converter.convertToEntityAttribute("failed")).isEqualTo(RunStatus.FAILED);
        assertThat(converter.convertToEntityAttribute("cancelled")).isEqualTo(RunStatus.CANCELLED);
    }
}
