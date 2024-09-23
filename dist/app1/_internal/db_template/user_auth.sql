-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 19, 2024 at 04:38 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `user_auth`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `employee_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` varchar(10) NOT NULL,
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `employee_id`, `date`, `status`, `time_in`, `time_out`, `last_updated`) VALUES
(18, 10, '2024-08-29', 'Active', '18:41:18', '18:46:29', '2024-08-29 10:41:18'),
(19, 12, '2024-09-18', 'Active', '16:29:34', NULL, '2024-09-18 08:29:34');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `designation` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Absent',
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `deployment_area` varchar(100) DEFAULT NULL,
  `id_picture` varchar(255) DEFAULT NULL,
  `qr_code_data` varchar(255) DEFAULT NULL,
  `last_updated` date DEFAULT NULL,
  `unit_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `first_name`, `last_name`, `designation`, `status`, `time_in`, `time_out`, `deployment_area`, `id_picture`, `qr_code_data`, `last_updated`, `unit_type`) VALUES
(10, 'Robert', 'Afton', 'Traffic Enforcer', 'Absent', NULL, NULL, 'SM Southmall', 'Robert_Afton.jpg', 'Employee ID: CL-0037, Name: Robert Afton, Unit Type: Motorcycle Unit', '2024-08-29', 'Motorcycle Unit'),
(11, 'Michael', 'Afton', 'Traffic Enforcer', 'Absent', NULL, NULL, 'Admiral', 'Michael_Afton.jpg', 'Employee ID: CL-0038, Name: Michael Afton, Unit Type: Motorcycle Unit', NULL, 'Fixed Post'),
(12, 'Red', 'Bird', 'Enforcer', 'Absent', NULL, NULL, 'Southland - Puregold', 'Red_Bird.jpg', 'Employee ID: CL-0039, Name: Red Bird, Unit Type: Motorcycle Unit', '2024-09-18', 'VIP Escort');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `employee_id` int(11) NOT NULL,
  `schedule` datetime NOT NULL,
  `status` enum('Pending','In Progress','Completed') DEFAULT 'Pending',
  `start_schedule` datetime DEFAULT NULL,
  `end_schedule` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `task_name`, `description`, `employee_id`, `schedule`, `status`, `start_schedule`, `end_schedule`) VALUES
(24, 'VIP Escort', '', 12, '0000-00-00 00:00:00', 'Pending', '2024-09-18 17:17:00', '2024-09-19 17:17:00');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','staff') DEFAULT 'staff'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `dob`, `username`, `email`, `password`, `role`) VALUES
(1, 'Arjean', 'Federez', '2024-08-08', 'admin', 'admin@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'staff'),
(2, 'Richardson', 'Smith', '2001-07-06', 'eggnog', 'eggnog@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', 'staff'),
(3, 'Lex', 'Luthor', '2024-08-13', 'admin1', 'administrator@gmail.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'admin'),
(4, 'Dan', 'Dan', '2024-08-06', 'staff', 'staff@gmail.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'staff'),
(5, 'Romnick', 'Canonigo', '2024-09-08', 'HansTrimmel', 'director@gmail.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `vip_escort_log`
--

CREATE TABLE `vip_escort_log` (
  `id` int(11) NOT NULL,
  `task_name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `employee_name` varchar(255) DEFAULT NULL,
  `unit_type` varchar(255) DEFAULT NULL,
  `deployment_area` varchar(255) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `start_schedule` datetime DEFAULT NULL,
  `end_schedule` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vip_escort_log`
--
ALTER TABLE `vip_escort_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `vip_escort_log`
--
ALTER TABLE `vip_escort_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`);

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`);

--
-- Constraints for table `vip_escort_log`
--
ALTER TABLE `vip_escort_log`
  ADD CONSTRAINT `vip_escort_log_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
