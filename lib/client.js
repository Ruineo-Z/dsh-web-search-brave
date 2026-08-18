window.__ModuleLoader__.load({
	id: "@dsh-local/dsh-web-search-brave",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _slots = require("@deepseek-ai/dsh-client-ui-slots");
		let reactJsx = require("react/jsx-runtime");
		let react = require("react");
		let _primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let _runtime = require("@deepseek-ai/dsh-client-runtime/client");

		// ── CSS ───────────────────────────────────────────────────────────────
		// We reuse the same CSS classes the base plugin already injected, so no
		// extra stylesheet is needed. The card renders into the same layout.

		// ── constants ─────────────────────────────────────────────────────────
		var NS = "web-search-brave";
		var DEFAULT_API_KEY_REF = "BRAVE_API_KEY";
		var API_KEY_FIELD = "apiKey";

		// ── helpers ───────────────────────────────────────────────────────────

		/**
		 * A minimal settings form that stages edits over a per-namespace
		 * settings scope. Only the secret apiKey field is wired here; other
		 * fields are left to settings.yaml edits.
		 */
		function CardForm(scope, secretSpecs) {
			var self = this;
			self.scope = scope;
			self.secretSpecs = secretSpecs || [];
			self.staged = new Map();
			self.saving = false;
			self.failed = false;
			self.listeners = new Set();
			scope.subscribe(function () { self.publish(); });
		}
		CardForm.prototype.bind = function (project) {
			var store = _runtime.createSnapshotStore(project());
			this.listeners.add(function () { store.set(project()); });
			return store;
		};
		CardForm.prototype.shell = function () {
			var snapshot = this.scope.getSnapshot();
			var plan = this.plan();
			return {
				available: snapshot.status === "ready",
				writable: snapshot.writable,
				dirty: plan.length > 0,
				invalid: plan.some(function (i) { return i.run === void 0; }),
				saving: this.saving,
				failed: this.failed
			};
		};
		CardForm.prototype.field = function (field) {
			var staged = this.staged.get(field);
			var secret = this.secretSpecs.find(function (s) { return s.field === field; });
			if (secret) {
				return { text: staged ? staged.text : "", overridden: false, invalid: false };
			}
			return { text: staged ? staged.text : "", overridden: false, invalid: false };
		};
		CardForm.prototype.actions = function () {
			var self = this;
			return {
				edit: function (field, text) { self.stage(field, { text: text, clear: false }); },
				save: function () { self.save(); },
				discard: function () {
					self.staged.clear();
					self.failed = false;
					self.publish();
				}
			};
		};
		CardForm.prototype.plan = function () {
			var plan = [];
			for (var _i = 0, _arr = Array.from(this.staged); _i < _arr.length; _i++) {
				var entry = _arr[_i];
				var field = entry[0];
				var staged = entry[1];
				var secret = this.secretSpecs.find(function (s) { return s.field === field; });
				if (secret) {
					var value = staged.text.trim();
					if (value !== "") plan.push({ field: field, run: function () { return secret.write(value); } });
				}
			}
			return plan;
		};
		CardForm.prototype.stage = function (field, edit) {
			this.staged.set(field, edit);
			this.failed = false;
			this.publish();
		};
		CardForm.prototype.publish = function () {
			var _this = this;
			this.listeners.forEach(function (l) { l(); });
		};
		CardForm.prototype.save = async function () {
			var plan = this.plan();
			var writes = plan.flatMap(function (i) { return i.run ? [i.run] : []; });
			if (plan.length === 0 || this.saving || writes.length !== plan.length) return;
			this.saving = true;
			this.failed = false;
			this.publish();
			var landed = true;
			for (var _i = 0; _i < writes.length; _i++) {
				var ok = await writes[_i]();
				landed = ok && landed;
			}
			if (landed) this.staged.clear();
			this.saving = false;
			this.failed = !landed;
			this.publish();
		};

		// ── controller ────────────────────────────────────────────────────────

		function BraveCardController(scope, api) {
			this.scope = scope;
			this.api = api;
			this.credential = { ref: "", configured: false, writable: true };
			this.form = new CardForm(scope, [{
				field: API_KEY_FIELD,
				write: (text) => this.writeKey(text)
			}]);
			this.store = this.form.bind(() => this.projection());
			this.readCredential();
			scope.subscribe(() => this.readCredential());
		}
		BraveCardController.prototype.projection = function () {
			return Object.assign({}, this.form.shell(), {
				apiKey: this.form.field(API_KEY_FIELD),
				apiKeyConfigured: this.credential.configured,
				apiKeyWritable: this.credential.writable
			});
		};
		BraveCardController.prototype.refOf = function () {
			var snapshot = this.scope.getSnapshot();
			var declared = snapshot.value && snapshot.value.apiKeyEnv;
			return declared && declared.length > 0 ? declared : DEFAULT_API_KEY_REF;
		};
		BraveCardController.prototype.readCredential = async function () {
			var ref = this.refOf();
			if (ref !== this.credential.ref) {
				this.credential = { ref: ref, configured: false, writable: true };
				this.store.set(this.projection());
			}
			try {
				var response = await this.api.credentials.describe({ refs: [ref] });
				if (!response.result.ok || ref !== this.refOf()) return;
				var view = response.result.value.credentials[ref];
				var next = {
					ref: ref,
					configured: (view && view.configured) || false,
					writable: (view && view.writable !== void 0) ? view.writable : true
				};
				if (next.configured === this.credential.configured && next.writable === this.credential.writable) return;
				this.credential = next;
				this.store.set(this.projection());
			} catch (_e) { /* ignore */ }
		};
		BraveCardController.prototype.writeKey = async function (value) {
			try {
				await this.api.credentials.set({ ref: this.refOf(), value: value });
			} catch (_e) { /* ignore */ }
			await this.readCredential();
			return this.credential.configured;
		};
		BraveCardController.prototype.inject = function () {
			var formActions = this.form.actions();
			return Object.assign({ hooks: { braveCard: this.store } }, formActions);
		};

		// ── locale ────────────────────────────────────────────────────────────

		var localeNS = "web-search-brave-card";
		var en = {
			title: "Brave Search",
			description: "Brave Search API provider.",
			apiKey: "API Key",
			apiKeyHint: "Stored outside the settings file. Leave blank to keep the current key.",
			apiKeySet: "A key is configured.",
			apiKeyUnset: "No key is configured; search is unavailable until one is.",
			overridden: "Overridden",
			reset: "Reset to default",
			save: "Save",
			saving: "Saving…",
			discard: "Discard",
			unsaved: "Unsaved",
			saveFailed: "The deployment did not accept these values."
		};
		var zh = {
			title: "Brave 搜索",
			description: "Brave Search API 提供方。",
			apiKey: "API Key",
			apiKeyHint: "不写入设置文件。留空表示保持当前密钥。",
			apiKeySet: "已配置密钥。",
			apiKeyUnset: "未配置密钥；配置之前搜索不可用。",
			overridden: "已覆盖",
			reset: "恢复默认",
			save: "保存",
			saving: "保存中…",
			discard: "放弃修改",
			unsaved: "未保存",
			saveFailed: "本部署没有接受这些值。"
		};

		// ── card component ────────────────────────────────────────────────────

		function BraveCard(props) {
			var t = props.t;
			var state = props.useBraveCard(function (snap) { return snap; });
			var disabled = !state.writable;
			return reactJsx.jsxs(react.Fragment, {
				children: [
					// Title + description header
					reactJsx.jsxs("div", {
						style: { marginBottom: 8 },
						children: [
							reactJsx.jsx("div", {
								style: { fontWeight: 600, fontSize: 14, color: "var(--dsw-alias-label-primary)" },
								children: t("title")
							}),
							reactJsx.jsx("div", {
								style: { fontSize: 13, color: "var(--dsw-alias-label-tertiary)", marginTop: 2 },
								children: t("description")
							})
						]
					}),
					// API key field
					reactJsx.jsxs("div", {
						style: { display: "flex", flexDirection: "column", gap: 6 },
						children: [
							reactJsx.jsxs("div", {
								style: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
								children: [
									reactJsx.jsx("label", {
										htmlFor: "plugin-config-brave-key",
										style: { fontSize: 13, fontWeight: 500, color: "var(--dsw-alias-label-primary)" },
										children: t("apiKey")
									}),
									reactJsx.jsx("span", {
										style: { fontSize: 12, color: state.apiKeyConfigured ? "var(--dsw-alias-state-success)" : "var(--dsw-alias-state-warning)" },
										children: state.apiKeyConfigured ? t("apiKeySet") : t("apiKeyUnset")
									})
								]
							}),
							reactJsx.jsx("input", {
								id: "plugin-config-brave-key",
								type: "password",
								placeholder: "BSA…",
								value: state.apiKey.text,
								disabled: disabled || !state.apiKeyWritable,
								onChange: function (e) { props.edit(API_KEY_FIELD, e.target.value); },
								style: {
									width: "100%",
									padding: "6px 10px",
									borderRadius: 6,
									border: "1px solid var(--dsw-alias-border-l2)",
									background: "var(--dsw-alias-surface-l1)",
									color: "var(--dsw-alias-label-primary)",
									fontSize: 13,
									outline: "none",
									fontFamily: "monospace"
								}
							}),
							reactJsx.jsx("div", {
								style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary)" },
								children: t("apiKeyHint")
							})
						]
					}),
					// Footer with save/discard
					state.dirty || state.saving || state.failed ? reactJsx.jsxs("div", {
						style: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 },
						children: [
							state.failed ? reactJsx.jsx("span", {
								style: { fontSize: 12, color: "var(--dsw-alias-state-danger)", alignSelf: "center" },
								children: t("saveFailed")
							}) : null,
							reactJsx.jsx("button", {
								disabled: state.saving,
								onClick: props.discard,
								style: { fontSize: 13, padding: "4px 12px", borderRadius: 6, cursor: "pointer" },
								children: t("discard")
							}),
							reactJsx.jsx("button", {
								disabled: state.saving || state.invalid,
								onClick: props.save,
								style: {
									fontSize: 13, padding: "4px 14px", borderRadius: 6, cursor: "pointer",
									background: "var(--dsw-alias-state-business-primary)", color: "#fff", border: "none"
								},
								children: state.saving ? t("saving") : t("save")
							})
						]
					}) : null
				]
			});
		}

		// ── apply ─────────────────────────────────────────────────────────────

		function apply(ctx) {
			var api = ctx.get("connection").api;
			var t = ctx.locale.bind(localeNS);

			ctx.effect(function () {
				ctx.locale.register(localeNS, { zh: zh, en: en });
			}, "ui-settings-brave: locale");

			var brave = new BraveCardController(
				ctx.settingsScope.bind({ namespace: NS }),
				api
			);

			ctx.effect(function () {
				return ctx.remote.$on("credentials/updated", function (ref) {
					if (ref === brave.refOf()) brave.readCredential();
				});
			}, "ui-settings-brave: credential invalidations");

			ctx.slots.inject("settings.plugin.item", function* () {
				yield ctx.slots.register({
					name: "settings.plugin.item",
					key: NS,
					locale: localeNS,
					inject: function () { return brave.inject(); }
				}, BraveCard);
			});
		}

		var inject = [
			"@deepseek-ai/dsh-client-connection",
			"@deepseek-ai/dsh-client-runtime",
			"@deepseek-ai/dsh-client-ui-settings",
			"@deepseek-ai/dsh-api-remotes"
		];

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
