package zygoo13.iot.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.IntegerSchema;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    OpenAPI iotOpenApi() {
        ObjectSchema error = new ObjectSchema();
        error.addProperty("code", new StringSchema());
        error.addProperty("message", new StringSchema());
        error.addProperty("requestId", new IntegerSchema().format("int64")
                .description("Chỉ có khi lệnh đã lưu nhưng publish MQTT thất bại."));
        error.setRequired(List.of("code", "message"));
        return new OpenAPI()
                .info(new Info().title("IoT Monitor API").version("BTH4")
                        .description("Đăng nhập bằng tài khoản cục bộ, sao chép token vào Authorize. "
                                + "Không nhập tiền tố Bearer. Thời gian JSON là UTC; page bắt đầu từ 0, size tối đa 20. "
                                + "HTTP 202 chỉ xác nhận đã nhận lệnh; trạng thái đèn chờ MQTT status. "
                                + "MQTT và STOMP /ws được mô tả trong Backend/CONTRACT.md; Swagger thử REST."))
                .servers(List.of(new Server().url("/").description("Cùng origin với Swagger UI")))
                .components(new Components().addSchemas("ApiError", error)
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }

    @Bean
    OpenApiCustomizer errorResponses() {
        return api -> api.getPaths().forEach((path, item) -> item.readOperations().forEach(operation -> {
            if ("/api/auth/login".equals(path)) {
                operation.setSecurity(List.of());
            }
            operation.getResponses().values().forEach(response -> {
                Content content = response.getContent();
                if (content != null && content.containsKey("*/*")) {
                    content.addMediaType("application/json", content.remove("*/*"));
                }
            });
            operation.getResponses().addApiResponse("400", error("Body hoặc query không hợp lệ."));
            operation.getResponses().addApiResponse("401", error("JWT thiếu/sai/hết hạn; login sai thông tin."));
        }));
    }

    private ApiResponse error(String description) {
        return new ApiResponse().description(description).content(new Content()
                .addMediaType("application/json", new MediaType()
                        .schema(new Schema<>().$ref("#/components/schemas/ApiError"))));
    }
}
