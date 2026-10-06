CREATE TABLE IF NOT EXISTS `User` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `fullName` VARCHAR(100) NOT NULL,
    `studentCode` VARCHAR(30) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `githubUrl` VARCHAR(500) NULL,
    `figmaUrl` VARCHAR(500) NULL,
    `apiDocsUrl` VARCHAR(500) NULL,
    `reportUrl` VARCHAR(500) NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(6) NOT NULL,
    `updatedAt` DATETIME(6) NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_user_username` UNIQUE (`username`),
    CONSTRAINT `uk_user_student_code` UNIQUE (`studentCode`),
    CONSTRAINT `uk_user_email` UNIQUE (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Sensor` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `active` BOOLEAN NOT NULL,
    `createdAt` DATETIME(6) NOT NULL,
    `updatedAt` DATETIME(6) NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_sensor_code` UNIQUE (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Device` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `status` VARCHAR(10) NOT NULL,
    `active` BOOLEAN NOT NULL,
    `createdAt` DATETIME(6) NOT NULL,
    `updatedAt` DATETIME(6) NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uk_device_code` UNIQUE (`code`),
    CONSTRAINT `ck_device_status` CHECK (`status` IN ('ON', 'OFF'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `SensorData` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sensorId` BIGINT NOT NULL,
    `value` DECIMAL(12,4) NOT NULL,
    `recordedAt` DATETIME(6) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_sensor_data_sensor_time` (`sensorId`, `recordedAt`),
    CONSTRAINT `fk_sensor_data_sensor` FOREIGN KEY (`sensorId`) REFERENCES `Sensor` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ActionHistory` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `deviceId` BIGINT NOT NULL,
    `action` VARCHAR(10) NOT NULL,
    `status` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(6) NOT NULL,
    `confirmedAt` DATETIME(6) NULL,
    PRIMARY KEY (`id`),
    KEY `idx_action_history_device_time` (`deviceId`, `createdAt`),
    CONSTRAINT `fk_action_history_user` FOREIGN KEY (`userId`) REFERENCES `User` (`id`),
    CONSTRAINT `fk_action_history_device` FOREIGN KEY (`deviceId`) REFERENCES `Device` (`id`),
    CONSTRAINT `ck_action_history_action` CHECK (`action` IN ('ON', 'OFF')),
    CONSTRAINT `ck_action_history_status` CHECK (`status` IN ('ON', 'OFF'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
