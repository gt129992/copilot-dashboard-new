import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

@NgModule({
  exports: [MatFormFieldModule, MatSelectModule, MatOptionModule, MatCheckboxModule]
})
export class MaterialModule {}
