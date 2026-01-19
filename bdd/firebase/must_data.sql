INSERT INTO status (code, label) VALUES
(1, 'Active'),
(2, 'Blocked');

INSERT INTO type_user (label, order_index) VALUES
('Utilisateur', 1),
('Manager', 2);

INSERT INTO Configurations (code, description, value) VALUES
('MAX_LOGIN_ATTEMPTS', 'Maximum number of login attempts before account lockout', '3'),
('SESSION_TIMEOUT_SECONDS', 'Duration of user session timeout in seconds', '3600');