module.exports = {
  apps: [{
    name: "mediavault",
    script: "./src/server.js",
    cwd: "/home/ubuntu/xDev/mediavault",

    env: {
      NODE_ENV: "production",
    },

    watch: false,
    max_restarts: 5,

    out_file: "./logs/mediavault-out.log",
    error_file: "./logs/mediavault-err.log"
  }]
}


