CREATE TABLE `campuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(96) NOT NULL,
	`name` varchar(160) NOT NULL,
	`location` varchar(160) NOT NULL,
	`mode` enum('demo','live') NOT NULL DEFAULT 'demo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campuses_id` PRIMARY KEY(`id`),
	CONSTRAINT `campuses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `dataSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`sourceType` enum('csv','sensor','api') NOT NULL,
	`status` enum('ready','connected','paused') NOT NULL DEFAULT 'ready',
	`approved` boolean NOT NULL DEFAULT false,
	`fieldMapping` text,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoringSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`highSeverityNotifications` boolean NOT NULL DEFAULT true,
	`scheduleMinutes` int NOT NULL DEFAULT 15,
	`scheduleCronTaskUid` varchar(65),
	`lastScheduleCheckAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoringSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `monitoring_settings_campus_unique` UNIQUE(`campusId`)
);
--> statement-breakpoint
CREATE TABLE `sustainabilityAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`code` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`metric` enum('energy','water','waste','carbon') NOT NULL,
	`observedValue` decimal(12,2) NOT NULL,
	`threshold` decimal(12,2) NOT NULL,
	`recommendedAction` text NOT NULL,
	`isSimulated` boolean NOT NULL DEFAULT true,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`lastNotifiedAt` timestamp,
	CONSTRAINT `sustainabilityAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sustainabilityScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`name` varchar(140) NOT NULL,
	`energyReductionPct` decimal(5,2) NOT NULL,
	`waterReductionPct` decimal(5,2) NOT NULL,
	`wasteDiversionPct` decimal(5,2) NOT NULL,
	`projectedCo2Kg` decimal(12,2) NOT NULL,
	`projectedSavingsInr` decimal(12,2) NOT NULL,
	`isSimulated` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sustainabilityScenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telemetry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`metric` enum('energy','water','waste','carbon') NOT NULL,
	`value` decimal(12,2) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`source` varchar(120) NOT NULL,
	`isSimulated` boolean NOT NULL DEFAULT true,
	`metadata` text,
	`capturedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telemetry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sources_campus_idx` ON `dataSources` (`campusId`);--> statement-breakpoint
CREATE INDEX `monitoring_settings_task_idx` ON `monitoringSettings` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `alerts_campus_status_idx` ON `sustainabilityAlerts` (`campusId`,`status`);--> statement-breakpoint
CREATE INDEX `scenarios_campus_idx` ON `sustainabilityScenarios` (`campusId`);--> statement-breakpoint
CREATE INDEX `telemetry_campus_metric_captured_idx` ON `telemetry` (`campusId`,`metric`,`capturedAt`);