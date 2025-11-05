import app from './server.js';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

server.on('error', (err) => {
    console.error('Server failed to start:', err && err.message ? err.message : err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err && err.stack ? err.stack : err);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
    process.exit(1);
});