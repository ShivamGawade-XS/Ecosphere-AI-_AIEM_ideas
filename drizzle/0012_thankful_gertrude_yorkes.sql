ALTER TABLE `monitoring_service_targets` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
ALTER TABLE `monitoring_service_targets` ADD `scheduleCronExpression` varchar(64);--> statement-breakpoint
ALTER TABLE `monitoring_service_targets` ADD `schedulerTrialStatus` enum('draft','active','paused','activation_failed') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `monitoring_service_targets` ADD `schedulerTrialLastRequestedAt` timestamp;--> statement-breakpoint
ALTER TABLE `monitoring_service_targets` ADD `schedulerTrialLastError` varchar(500);--> statement-breakpoint
ALTER TABLE `monitoring_service_targets` ADD `schedulerTrialUpdatedByUserId` int;--> statement-breakpoint
ALTER TABLE `monitoring_service_targets` ADD CONSTRAINT `monitoring_targets_task_uid_unique` UNIQUE(`scheduleCronTaskUid`);--> statement-breakpoint
ALTER TABLE `monitoring_service_targets` ADD CONSTRAINT `mst_trial_user_fk` FOREIGN KEY (`schedulerTrialUpdatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
