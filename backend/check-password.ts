import bcrypt from 'bcrypt';

const hash = '$2b$12$rESd6iTxKWl4afloGmAZAuTOKbZDZ09mb4LKRQKOcZZqTXMYvrG42';

bcrypt.compare('password123', hash).then(result => {
  console.log('Password valid:', result);
});