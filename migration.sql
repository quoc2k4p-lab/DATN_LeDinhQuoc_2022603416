ALTER TABLE cars
ADD COLUMN car_condition ENUM('new', 'used')
DEFAULT 'used';

-- Phase 3: Vehicle Reservation Status Support
ALTER TABLE cars
MODIFY status ENUM('available', 'reserved', 'sold', 'hidden') DEFAULT 'available';

ALTER TABLE cars
ADD COLUMN reserved_until DATETIME NULL DEFAULT NULL;
