import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-equipment-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './equipment-card.component.html',
  styleUrl: './equipment-card.component.sass'
})
export class EquipmentCardComponent {
  @Input() item: any;
  @Input() isRightColumn: boolean = false;

  onImageError(event: Event) {
    console.error(`Error loading image for item: ${this.item.name}`);
    console.error(`Failed URL: ${this.item.iconUrl}`);
    (event.target as HTMLImageElement).style.display = 'none';
  }

  getWowheadUrl(): string {
    return `https://www.wowhead.com/item=${this.item.item.id}`;
  }

  getTransmogWowheadUrl(): string {
    return this.item.transmog ? `https://www.wowhead.com/item=${this.item.transmog.item.id}` : '';
  }

  hasTransmog(): boolean {
    return !!this.item.transmog;
  }

  getTransmogIconRotation(): string {
    return this.isRightColumn ? 'rotate-180' : 'rotate-90';
  }
}
