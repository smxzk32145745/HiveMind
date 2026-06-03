package io.agentflow.api.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Persists {@link RunStatus} as lowercase wire strings ({@code pending},
 * {@code waiting_human}, …) so Java and Python share the same {@code runs.status}
 * and {@code steps.status} column values.
 */
@Converter(autoApply = true)
public class RunStatusConverter implements AttributeConverter<RunStatus, String> {

    @Override
    public String convertToDatabaseColumn(RunStatus attribute) {
        return attribute == null ? null : attribute.wire();
    }

    @Override
    public RunStatus convertToEntityAttribute(String dbData) {
        return RunStatus.fromWire(dbData);
    }
}
