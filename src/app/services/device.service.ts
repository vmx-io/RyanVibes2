import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private isMobileDevice: boolean;

  constructor() {
    this.isMobileDevice = this.detectMobileDevice();
  }

  private detectMobileDevice(): boolean {
    // Check for mobile user agent
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 
      'windows phone', 'mobile', 'tablet'
    ];
    
    const isMobileByUserAgent = mobileKeywords.some(keyword => 
      userAgent.includes(keyword)
    );

    // Check for touch capability
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Check screen size
    const isSmallScreen = window.innerWidth <= 768;

    // Consider it mobile if any of these conditions are met
    return isMobileByUserAgent || (hasTouchScreen && isSmallScreen);
  }

  isMobile(): boolean {
    return this.isMobileDevice;
  }

  isDesktop(): boolean {
    return !this.isMobileDevice;
  }

  getScreenWidth(): number {
    return window.innerWidth;
  }

  getScreenHeight(): number {
    return window.innerHeight;
  }

  isSmallScreen(): boolean {
    return this.getScreenWidth() <= 768;
  }

  isMediumScreen(): boolean {
    return this.getScreenWidth() > 768 && this.getScreenWidth() <= 1024;
  }

  isLargeScreen(): boolean {
    return this.getScreenWidth() > 1024;
  }
} 