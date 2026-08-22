CREATE TABLE `sustainabilityRecommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`impact` enum('low','medium','high') NOT NULL,
	`detail` text NOT NULL,
	`action` varchar(140) NOT NULL,
	`status` enum('active','dismissed','implemented') NOT NULL DEFAULT 'active',
	`isSimulated` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sustainabilityRecommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `recommendations_campus_status_idx` ON `sustainabilityRecommendations` (`campusId`,`status`);