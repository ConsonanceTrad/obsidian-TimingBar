import { read } from 'fs';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { moment } from 'obsidian';

interface ShowTimeSettings {
	//StatusBarToggle
	CurrentStatusBarToggle: boolean;
	waitingStatusBarToggle: boolean;
	CutdownStatusBarToggle: boolean;
	PositiveTimingStatusBarToggle: boolean;
	//Others
	cutdownToggle: boolean;
	LogUrl: string;
	StartTime: string;
	Keep: string;
}
const DEFAULT_SETTINGS: ShowTimeSettings = {
	//StatusBarToggle
	CurrentStatusBarToggle: false,
	waitingStatusBarToggle: true,
	CutdownStatusBarToggle: false,
	PositiveTimingStatusBarToggle: false,
	//Others
	cutdownToggle: false,
	LogUrl: "",
	StartTime: "",
	Keep: "20",
}

export default class ShowTime extends Plugin {
	//import setting values
	settings: ShowTimeSettings;

	currentBar: HTMLElement;
	waitingBar: HTMLElement;
	cutdownBar: HTMLElement;
	existSettingTab = 0;
	SettingTab: ShowTimeSettingTab;

	async onload() {
		await this.loadSettings();
		this.resetCutdownToggle();
		this.registerCodeMirror(cm => {
			cm.on('change', this.onChange);
		});

		this.waitingBar = this.addStatusBarItem();
		this.waitingBar.toggle(this.settings.waitingStatusBarToggle);
		this.updatewaitingStatusBar();
		this.registerInterval(
			window.setInterval(() => this.updatewaitingStatusBar(), 250)
		);

		this.currentBar = this.addStatusBarItem();
		this.currentBar.toggle(this.settings.CurrentStatusBarToggle);
		this.updateStatusBar();
		this.registerInterval(
			window.setInterval(() => this.updateStatusBar(), 1000)
		);



		this.cutdownBar = this.addStatusBarItem();
		this.cutdownBar.toggle(this.settings.CutdownStatusBarToggle);
		this.cutdown();
		this.registerInterval(
			window.setInterval(()=> this.cutdown(),1000)
		)
		this.addCommand({
			id: 'obsidian-showtime-reload',
			name: 'Reload',
			callback: () => {
				new Notice('Reload ShowTime.');
				console.log('Reload ShowTime.');
				this.onunload();
				this.onload();
			}
		});
		this.addCommand({
			id: 'obsidian-showtime-Start-Cutdown',
			name: 'Start Cutdown',
			callback: () => {
				new Notice('The countdown has been reset.');
				console.log('Change StartTime and restart Cutdown');
				this.resetStartTime();
			}
		});
		this.addCommand({
			id: 'obsidian-showtime-Close-Cutdown',
			name: 'Close Cutdown',
			callback: () => {
				new Notice('The countdown has been Close.');
				console.log('Change StartTime and restart Cutdown');
				this.resetCutdownToggle();
			}
		});


		if(this.existSettingTab==0){
			this.SettingTab = new ShowTimeSettingTab(this.app, this);
			this.existSettingTab++;
			this.addSettingTab(this.SettingTab);
		}
	}

	onunload() {
		this.currentBar.remove();
		this.waitingBar.remove();
		this.cutdownBar.remove();
		this.app.workspace.iterateCodeMirrors(cm => {
			cm.off('change', this.onChange);
		});
	}

	onChange: () => {
		// ...
	}


	//Using setting values
	async loadSettings() {this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());}

	//Sava setting values
	async saveSettings() {await this.saveData(this.settings);}

	updateStatusBar() {this.currentBar.setText(moment().format("H") + "-" + Math.floor(parseInt(moment().format("mm"))/15) +"q" );}

	updatewaitingStatusBar() {
		// var second = parseInt(moment().format("ss"))%2;
		var ms = parseInt(moment().format("SSS"));
		// if(second==0 && ms<250){
		// 	this.waitingBar.setText('-');
		// }
		// else if(second==0 && ms>=250 && ms<500){
		// 	this.waitingBar.setText("\\");
		// }
		// else if(second==0 && ms>=500 && ms<750){
		// 	this.waitingBar.setText("|");
		// }
		// else if(second==0 && ms>=750){
		// 	this.waitingBar.setText("/");
		// }
		// if(second==1 && ms<250){
		// 	this.waitingBar.setText('-');
		// }
		// else if(second==1 && ms>=250 && ms<500){
		// 	this.waitingBar.setText("\\");
		// }
		// else if(second==1 && ms>=500 && ms<750){
		// 	this.waitingBar.setText("|");
		// }
		// else if(second==1 && ms>=750){
		// 	this.waitingBar.setText("/");
		// }
		if(ms<250){
			this.waitingBar.setText('-');
		}
		else if(ms>=250 && ms<500){
			this.waitingBar.setText("\\");
		}
		else if(ms>=500 && ms<750){
			this.waitingBar.setText("|");
		}
		else if(ms>=750){
			this.waitingBar.setText("/");
		}
	}

	cutdown(){
		var end =  moment(this.settings.StartTime,'YYYY:MM:DD:HH:mm:ss').add(parseInt(this.settings.Keep),'minutes').format('YYYY:MM:DD:HH:mm:ss');
		var diff = this.getTimeDiff(this.getTimestamp(),end);
		this.cutdownBar.setText(diff.toString()+'/'+parseInt(this.settings.Keep)*60 + 's' + ' ' +parseInt(this.settings.Keep)+ 'm Total');
	}




	getTimestamp():string{
		console.log('Current:' + moment().format('YYYY:MM:DD:HH:mm:ss'));
		return moment().format('YYYY:MM:DD:HH:mm:ss');
	}
	getTimeDiff(timestamp_Start:string,timestamp_End:string):number{
		console.log(timestamp_Start+"->"+timestamp_End);
		var s = moment(timestamp_Start,'YYYY:MM:DD:HH:mm:ss');
		console.log('StartTime:'+s);
		console.log('StartTime:'+s.format('YYYY:MM:DD:HH:mm:ss'));
		var e = moment(timestamp_End,'YYYY:MM:DD:HH:mm:ss');
		console.log('EndTime:'+e);
		console.log('EndTime:'+e.format('YYYY:MM:DD:HH:mm:ss'));
		var diff = e.diff(s,'seconds');
		if(diff<=0){
			console.log('Timediff:'+diff);
			return 0;
		}else{
			console.log('Timediff:'+diff);
			return diff;
		}
	}
	async resetStartTime(){
		this.settings.StartTime = this.getTimestamp();
		await this.saveSettings();
	}
	async resetCutdownToggle(){
		this.settings.cutdownToggle = false;
		await this.saveSettings();
	}

}

class ShowTimeSettingTab extends PluginSettingTab {
	plugin: ShowTime;

	constructor(app: App, plugin: ShowTime) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('p', {text: ''});
		
		containerEl.createEl('h2', {text: 'Basic-ShowTime Toggle'});
		new Setting(containerEl)
			.setName('WaitingBar')
			.setDesc('When open, there will be a line run in circle at the statubar.')
			.addToggle( toggle => toggle 
				.setValue(this.plugin.settings.waitingStatusBarToggle)
				.onChange(async (toggle) => {
					console.log('TELL:' + toggle);
					this.plugin.settings.waitingStatusBarToggle = toggle;
					await this.plugin.saveSettings();
					this.plugin.onunload();
					this.plugin.onload();
				})
			)
		;
		new Setting(containerEl)
			.setName('TimeBar')
			.setDesc('When open, there will be a TimeClockd at the statubar.')
			.addToggle( toggle => toggle 
				.setValue(this.plugin.settings.CurrentStatusBarToggle)
				.onChange(async (toggle) => {
					console.log('TELL:' + toggle);
					this.plugin.settings.CurrentStatusBarToggle = toggle;
					await this.plugin.saveSettings();
					this.plugin.onunload();
					this.plugin.onload();
				})
			)
		;


		containerEl.createEl('h2', {text: 'Cutdown Settings'});
		containerEl.createEl('li', {text: "Use 'command:Start Cutdown' to start cutdown"});
		containerEl.createEl('li', {text: "Use 'command:Close Cutdown' to close cutdown"});
		new Setting(containerEl)
		.setName('CutdownBar')
		.setDesc('When open, there will be a Cutdown Timer at the statubar.')
		.addToggle( toggle => toggle 
			.setValue(this.plugin.settings.CutdownStatusBarToggle)
			.onChange(async (toggle) => {
				console.log('TELL:' + toggle);
				this.plugin.settings.CutdownStatusBarToggle = toggle;
				await this.plugin.saveSettings();
				this.plugin.onunload();
				this.plugin.onload();
			})
		)
		;	
		new Setting(containerEl)
			.setName('Duration')
			.setDesc('The length of cutdown')
			.addTextArea(textline => textline
				.setPlaceholder('The length of cutdown')
				.setValue(this.plugin.settings.Keep)
				.onChange(async (text) =>{
					console.log('Lines: '+this.plugin.settings.Keep);
					this.plugin.settings.Keep = text;
				})
			)
		;




		containerEl.createEl('h2', {text: 'Positive Timing Settings'});
		containerEl.createEl('li', {text: "Use 'command:Start Positive' to start Positive Timing"});
		containerEl.createEl('li', {text: "Use 'command:Close Positive' to close Positive Timing"});
		new Setting(containerEl)
		.setName('Positive Timing Bar')
		.setDesc('When open, there will be a Cutdown Timer at the statubar.')
		.addToggle( toggle => toggle 
			.setValue(this.plugin.settings.PositiveTimingStatusBarToggle)
			.onChange(async (toggle) => {
				console.log('TELL:' + toggle);
				this.plugin.settings.PositiveTimingStatusBarToggle = toggle;
				await this.plugin.saveSettings();
				this.plugin.onunload();
				this.plugin.onload();
			})
		)
		;	

		containerEl.createEl('hr');
		containerEl.createEl('h4', {text: 'From N010, here is my github'});
		containerEl.createEl('a', {text: 'https://github.com/PPN010'});
		// var vaultline = '';
		// this.plugin.settings.vaults.forEach(element => {
		// 	vaultline += element + ','
		// });
		// new Setting(containerEl)
		// 	.setName('Vault-Lines')
		// 	.setDesc('鎼存挸鍨悰锟�')
		// 	.addTextArea(textline => textline
		// 		.setPlaceholder('鏉堟挸鍙嗘惔鎾虫倳閿涘奔濞囬悽銊ュ磹鐟欐帡鈧褰块梻鎾')
		// 		.setValue(vaultline)
		// 		.onChange(async (text) =>{
		// 			console.log('Lines: '+vaultline);
		// 			this.plugin.settings.vaults = text.split(',');
		// 		})
		// 	)
		// ;

		// containerEl.createEl('h1', {text: '閸忔湹绮�'});

	}
}
