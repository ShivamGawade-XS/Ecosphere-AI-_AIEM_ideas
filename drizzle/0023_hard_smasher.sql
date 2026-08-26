CREATE TABLE `user_notification_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`userId` int NOT NULL,
	`notificationKey` varchar(160) NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_notification_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_states_org_user_key_unique` UNIQUE(`organizationId`,`userId`,`notificationKey`)
);
--> statement-breakpoint
ALTER TABLE `user_notification_states` ADD CONSTRAINT `user_notification_states_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_notification_states` ADD CONSTRAINT `user_notification_states_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notification_states_user_updated_idx` ON `user_notification_states` (`userId`,`updatedAt`);