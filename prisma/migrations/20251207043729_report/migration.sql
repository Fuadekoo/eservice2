-- AlterTable
ALTER TABLE `file_data` ADD COLUMN `reportId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `report` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `reportSentTo` VARCHAR(191) NOT NULL,
    `receiverStatus` ENUM('pending', 'sent', 'received', 'read', 'archived') NOT NULL DEFAULT 'pending',
    `reportSentBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `file_data` ADD CONSTRAINT `file_data_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `report`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report` ADD CONSTRAINT `report_reportSentTo_fkey` FOREIGN KEY (`reportSentTo`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report` ADD CONSTRAINT `report_reportSentBy_fkey` FOREIGN KEY (`reportSentBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
