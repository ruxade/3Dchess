
const { merge } = require('webpack-merge');
const commonConfiguration = require('./webpack.common.js');
const ip = require('internal-ip');
const portFinderSync = require('portfinder-sync');

const infoColor = (_message) => {
    return `\u001b[1m\u001b[34m${_message}\u001b[39m\u001b[22m`;
};

module.exports = merge(
    commonConfiguration,
    {
        mode: 'development',
        devServer: {
            static: './dist', // Replace 'contentBase' with 'static'
            host: ip.v4.sync(), // Automatically get the local IP address
            port: portFinderSync.getPort(8080),
            watchFiles: ['src/**/*'], // Optional: specify which files to watch
            open: true,
            https: false,
            allowedHosts: 'all', // Allow all hosts
            client: {
                logging: 'none', // Disable client-side logging
                overlay: {
                    warnings: false, // Disable warning overlays
                    errors: true, // Enable error overlays
                },
            },
            onListening: function (server) {
                const address = server.server.address(); // Access the HTTP server's address
                const port = address.port;
                const https = server.options.https ? 's' : '';
                const localIp = ip.v4.sync(); // Get the local IP address
                const domain1 = `http${https}://${localIp}:${port}`;
                const domain2 = `http${https}://localhost:${port}`;
                console.log(`Project running at:\n  - ${infoColor(domain1)}\n  - ${infoColor(domain2)}`);
            },
        },
    }
);
