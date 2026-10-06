'use strict';
// Preserve every upstream rule/configuration and adapt the removed context APIs.
const { fixupPluginRules, fixupConfigRules } = require('@eslint/compat');
const upstream = require('./lib/index.js');
const plugin = fixupPluginRules(upstream);
const namespace = 'jsx-a11y';
const adaptConfigurations = group => Object.fromEntries(Object.entries(group).map(([name, config]) => {
  if (name === 'flat') return [name, adaptConfigurations(config)];
  if (!config.plugins || Array.isArray(config.plugins)) return [name, config];
  const adapted = fixupConfigRules(config)[0];
  // Flat presets sometimes embed another object around the same original rules.
  // Reuse the adapted export so combining presets cannot redefine the plugin.
  if (adapted.plugins[namespace]) adapted.plugins = { ...adapted.plugins, [namespace]: plugin };
  return [name, adapted];
}));
if (upstream.configs) plugin.configs = adaptConfigurations(upstream.configs);
if (upstream.flatConfigs) plugin.flatConfigs = adaptConfigurations(upstream.flatConfigs);
module.exports = plugin;
