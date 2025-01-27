import { afterAll, beforeAll, describe, it, expect, test, vi } from 'vitest'
import { Browser, PropertySymbol } from "happy-dom";
// import { getContext } from 'svelte';
// import Emittery from 'emittery';

// const emitter = new Emittery();
// setContext('emitter', emitter);

// @vitest-environment happy-dom
// It was "ownerWindow" in older versions of Happy DOM
const browserWindow =
	// global.document[PropertySymbol.ownerWindow] ||
	global.document[PropertySymbol.window];

global.setTimeout = browserWindow.setTimeout;
global.clearTimeout = browserWindow.clearTimeout;
global.setInterval = browserWindow.setInterval;
global.clearInterval = browserWindow.clearInterval;
global.requestAnimationFrame = browserWindow.requestAnimationFrame;
global.cancelAnimationFrame = browserWindow.cancelAnimationFrame;
global.queueMicrotask = browserWindow.queueMicrotask;

    const browser = new Browser();
    const page = browser.newPage();
beforeAll(async () => {

    await page.goto('http://localhost:8080/cgi/pt?id=test.pd_open');
    // await emitter.once('update.history')
    page.mainFrame.document.addEventListener("readystatechange", (event) => {
        // log.textContent = `${log.textContent}readystate: ${document.readyState}\n`;
        page.mainFrame.window.console.log('ready state change', page.mainFrame.document.readyState)
      });    
      page.mainFrame.document.addEventListener("DOMContentLoaded", (event) => {
        // log.textContent = `${log.textContent}readystate: ${document.readyState}\n`;
        page.mainFrame.window.console.log('dom content loaded' )
      });
    await page.waitUntilComplete();
})

afterAll(async () => {
    page.mainFrame.window.console.log("Test", { test: true });

    const log = page.virtualConsolePrinter.readAsString();
    
    // Will output 'Test {"test": true}' to the NodeJS console
    global.console.log(log);
})

describe('Document is available', () => {
    it('should not be undefined', () => {
               expect(page.mainFrame.document).toBeDefined() 
            })
    // it('should have a table', () => {
    //     expect(page.mainFrame.document.querySelector('table')).not.toBeNull() 
    //     })
    })
describe('Main element exists', () => {
    it('should not be null', () => {
        expect(page.mainFrame.document.querySelector('main')).not.toBeNull()
    })
})
describe('Table should return null', () => {
    it('should be null', () => {
        expect(page.mainFrame.document.querySelector('table')).toBeNull()
    })
})

