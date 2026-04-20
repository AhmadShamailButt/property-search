-- Remove hardcoded default location from profiles
alter table profiles alter column location drop default;
