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

		var css = ".brv_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}.brv_card:hover{border-color:var(--dsw-alias-label-dimmed)}.brv_cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}.brv_header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.brv_header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.brv_headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.brv_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.brv_description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.brv_chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}.brv_chevronOpen{transform:rotate(180deg)}.brv_body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}.brv_readOnly{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:1.5}.brv_pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.brv_footer{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}.brv_failed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}.brv_discard,.brv_save{appearance:none;font:inherit;cursor:pointer;border:1px solid transparent;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}.brv_discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}.brv_save{color:#fff;background:var(--dsw-alias-state-business-primary)}.brv_save:disabled,.brv_discard:disabled{opacity:.6;cursor:default}.brv_fieldLabel{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}.brv_fieldInput{width:100%;padding:6px 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-surface-l1);color:var(--dsw-alias-label-primary);font-size:13px;outline:none;font-family:monospace}.brv_fieldInput:focus{border-color:var(--dsw-alias-state-business-primary)}.brv_fieldHint{font-size:12px;color:var(--dsw-alias-label-tertiary);margin-top:6px}";
		if (typeof document !== "undefined" && document.querySelector("style[data-brave-card-css]") === null) {
			var tag = document.createElement("style");
			tag.setAttribute("data-brave-card-css", "");
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		var NS = "web-search-brave";
		var DEFAULT_API_KEY_REF = "BRAVE_API_KEY";
		var API_KEY_FIELD = "apiKey";

		function CardForm(scope, secretSpecs) {
			this.scope = scope;
			this.secretSpecs = secretSpecs || [];
			this.staged = new Map();
			this.saving = false;
			this.failed = false;
			this.listeners = new Set();
			var self = this;
			scope.subscribe(function () { self.publish(); });
		}
		CardForm.prototype.bind = function (project) {
			var store = _runtime.createSnapshotStore(project());
			var self = this;
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
			return { text: staged ? staged.text : "", overridden: false, invalid: false };
		};
		CardForm.prototype.actions = function () {
			var self = this;
			return {
				edit: function (field, text) { self.stage(field, { text: text, clear: false }); },
				save: function () { self.save(); },
				discard: function () { self.staged.clear(); self.failed = false; self.publish(); }
			};
		};
		CardForm.prototype.plan = function () {
			var plan = [];
			this.staged.forEach(function (staged, field) {
				var secret = null;
				for (var i = 0; i < this.secretSpecs.length; i++) {
					if (this.secretSpecs[i].field === field) secret = this.secretSpecs[i];
				}
				if (secret) {
					var value = staged.text.trim();
					if (value !== "") plan.push({ field: field, run: function () { return secret.write(value); } });
				}
			}, this);
			return plan;
		};
		CardForm.prototype.stage = function (field, edit) { this.staged.set(field, edit); this.failed = false; this.publish(); };
		CardForm.prototype.publish = function () { var self = this; this.listeners.forEach(function (l) { l(); }); };
		CardForm.prototype.save = async function () {
			var plan = this.plan();
			var writes = [];
			plan.forEach(function (i) { if (i.run) writes.push(i.run); });
			if (plan.length === 0 || this.saving || writes.length !== plan.length) return;
			this.saving = true;
			this.failed = false;
			this.publish();
			var landed = true;
			for (var i = 0; i < writes.length; i++) {
				var ok = await writes[i]();
				landed = ok && landed;
			}
			if (landed) this.staged.clear();
			this.saving = false;
			this.failed = !landed;
			this.publish();
		};

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
			} catch (_e) { }
		};
		BraveCardController.prototype.writeKey = async function (value) {
			try {
				await this.api.credentials.set({ ref: this.refOf(), value: value });
			} catch (_e) { }
			await this.readCredential();
			return this.credential.configured;
		};
		BraveCardController.prototype.inject = function () {
			var actions = this.form.actions();
			return {
				hooks: { braveCard: this.store },
				edit: actions.edit,
				save: actions.save,
				discard: actions.discard
			};
		};

		var localeNS = "web-search-brave-card";
		var en = {
			title: "Brave Search",
			description: "Brave Search API provider",
			apiKey: "API Key",
			apiKeyHint: "Stored outside the settings file. Leave blank to keep the current key.",
			apiKeySet: "A key is configured.",
			apiKeyUnset: "No key is configured; search is unavailable until one is.",
			expand: "Show settings",
			collapse: "Hide settings",
			save: "Save",
			saving: "Saving…",
			discard: "Discard",
			unsaved: "Unsaved",
			saveFailed: "The deployment did not accept these values.",
			readOnly: "This deployment stores settings read-only."
		};
		var zh = {
			title: "Brave 搜索",
			description: "Brave Search API 提供方",
			apiKey: "API Key",
			apiKeyHint: "不写入设置文件。留空表示保持当前密钥。",
			apiKeySet: "已配置密钥。",
			apiKeyUnset: "未配置密钥；配置之前搜索不可用。",
			expand: "展开设置",
			collapse: "收起设置",
			save: "保存",
			saving: "保存中…",
			discard: "放弃修改",
			unsaved: "未保存",
			saveFailed: "本部署没有接受这些值。",
			readOnly: "本部署的设置为只读。"
		};

		function BraveCardWrapper(props) {
			var openState = react.useState(false);
			var state = props.useBraveCard(function (s) { return s; });
			if (!state.available) return null;
			var title = props.t("title");
			var blocked = !state.dirty || state.invalid || state.saving;
			var open = openState[0];
			return reactJsx.jsxs("li", {
				className: (open ? "brv_card brv_cardOpen" : "brv_card"),
				children: [
					reactJsx.jsxs("button", {
						type: "button",
						className: "brv_header",
						"aria-expanded": open,
						"aria-label": props.t(open ? "collapse" : "expand") + ": " + title,
						onClick: function () { openState[1](!open); },
						children: [
							reactJsx.jsxs("span", {
								className: "brv_headText",
								children: [
									reactJsx.jsx("span", { className: "brv_name", children: title }),
									reactJsx.jsx("span", { className: "brv_description", children: props.t("description") })
								]
							}),
							state.dirty ? reactJsx.jsx("span", { className: "brv_pending", children: props.t("unsaved") }) : null,
							reactJsx.jsx(_primitives.IconChevronDownOutline14, { className: open ? "brv_chevron brv_chevronOpen" : "brv_chevron" })
						]
					}),
					open ? reactJsx.jsxs("div", {
						className: "brv_body",
						children: [
							!state.writable ? reactJsx.jsx("p", { className: "brv_readOnly", role: "status", children: props.t("readOnly") }) : null,
							reactJsx.jsxs("div", {
								style: { marginTop: 12 },
								children: [
									reactJsx.jsxs("div", {
										className: "brv_fieldLabel",
										children: [
											reactJsx.jsx("label", { htmlFor: "plugin-config-brave-key", style: { fontSize: 13, fontWeight: 500, color: "var(--dsw-alias-label-primary)" }, children: props.t("apiKey") }),
											reactJsx.jsx("span", { style: { fontSize: 12, color: state.apiKeyConfigured ? "var(--dsw-alias-state-success)" : "var(--dsw-alias-state-warning)" }, children: state.apiKeyConfigured ? props.t("apiKeySet") : props.t("apiKeyUnset") })
										]
									}),
									reactJsx.jsx("input", {
										id: "plugin-config-brave-key",
										type: "password",
										placeholder: "BSA…",
										value: state.apiKey.text,
										disabled: !state.writable || !state.apiKeyWritable,
										onChange: function (e) { props.edit(API_KEY_FIELD, e.target.value); },
										className: "brv_fieldInput"
									}),
									reactJsx.jsx("div", { className: "brv_fieldHint", children: props.t("apiKeyHint") })
								]
							}),
							reactJsx.jsxs("div", {
								className: "brv_footer",
								children: [
									state.failed ? reactJsx.jsx("p", { className: "brv_failed", role: "status", children: props.t("saveFailed") }) : null,
									reactJsx.jsx("button", { type: "button", className: "brv_discard", disabled: !state.dirty || state.saving, onClick: props.discard, children: props.t("discard") }),
									reactJsx.jsx("button", { type: "button", className: "brv_save", disabled: blocked, onClick: props.save, children: props.t(state.saving ? "saving" : "save") })
								]
							})
						]
					}) : null
				]
			});
		}

		function apply(ctx) {
			var api = ctx.get("connection").api;
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
					inject: function () {
						var injected = brave.inject();
						return {
							hooks: injected.hooks,
							edit: injected.edit,
							save: injected.save,
							discard: injected.discard
						};
					}
				}, BraveCardWrapper);
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
