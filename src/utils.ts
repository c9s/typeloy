import {ServerConfig} from "./config";

const path = require('path');

export function get_ssh_rsync_command(server : ServerConfig, remotePath : string) : string {
    const cmd = ["rsync", "-av", "--progress"];
    const e = [];
    if (server.pem) {
        e.push("ssh", "-i", server.pem);
    } else if (server.password) {
        // sshpass -p your_password
        e.push("sshpass", "-p", server.password, "ssh");
    }
    if (server.sshOptions && server.sshOptions.port) {
        e.push('-p', server.sshOptions.port + "");
    }
    cmd.push("-e", "'" + e.join(' ') + "'");
    cmd.push(`${server.username}@${server.host}:${remotePath}`);
    return cmd.join(' ');
}

export function get_ssh_login_command(server : ServerConfig) : string {
    const cmd = ["ssh"];
    if (server.pem) {
        cmd.push('-i');
        cmd.push(server.pem);
    } else if (server.password) {
        // sshpass -p your_password
        cmd.unshift("sshpass", "-p", server.password);
    }
    if (server.sshOptions && server.sshOptions.port) {
        cmd.push('-p', server.sshOptions.port + "");
    }
    cmd.push(`${server.username}@${server.host}`);
    return cmd.join(' ');
}

export function get_ssh_config(site : string, siteConfig, server : ServerConfig) : string {
    const lines = [
      `HostName ${siteConfig.siteName || site}`,
      `  Host ${server.host}`,
      `  User ${server.username}`,
    ];

    if (server.pem) {
      const pemFile = path.resolve(server.pem);
      lines.push(`  IdentityFile ${pemFile}`);
    }
    if (server.sshOptions && server.sshOptions.port) {
      lines.push(`  Port ${server.sshOptions.port}`);
    }
    return lines.join("\n");
}
