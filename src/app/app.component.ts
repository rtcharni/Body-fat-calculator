import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  selectedFile: File;
  userData: StatisticsData[] = [];

  Highcharts = Highcharts;
  chartConstructor = 'chart';
  updateFlag = false;
  oneToOneFlag = true;

  chartOptions = {
    chart: {
      zoomType: 'x'
    },
    credits: {
      enabled: false
    },
    title: {
      text: 'Your Health Progress'
    },
    subtitle: {
      text: 'PAIN IS GAIN!'
    },
    xAxis: {
      type: 'datetime'
    },
    yAxis: [{
      title: {
        text: 'Lean Body Mass'
      },
      labels: {
        format: '{value} kg'
      }
    }, {
      title: {
        text: 'Body Fat'
      },
      opposite: true,
      labels: {
        format: '{value} kg'
      }
    }],
    tooltip: { },
    plotOptions: {
      series: {
      }
    },
    series: []
  };

  form = new FormGroup({
    chest: new FormControl(null, [Validators.required, Validators.min(0)]),
    abdominal: new FormControl(null, [Validators.required, Validators.min(0)]),
    thigh: new FormControl(null, [Validators.required, Validators.min(0)]),
    age: new FormControl(null, [Validators.required, Validators.min(0)]),
    weight: new FormControl(null, [Validators.required, Validators.min(0)]),
  });

  calculatedValues: StatisticsData;

  ngOnInit() { }

  uploadFile(event: any) {
    this.selectedFile = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.readAsText(this.selectedFile, 'UTF-8');
    fileReader.onload = () => {
      const parsedData = JSON.parse(fileReader.result as string);
      this.userData = parsedData;
      this.showChart();
      this.updateFlag = true;
    };
    fileReader.onerror = (error) => {
      console.log(error);
    };
  }

  downloadFile(content: StatisticsData[]) {
    const json = JSON.stringify(content);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=UTF-8,' + encodeURIComponent(json));
    element.setAttribute('download', 'body-fat-calculator-statistics.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  calculateBodyDensity(chestMM: number, abdominalMM: number, thighMM: number, age: number) {
    const sumOfSkinFolds: number = chestMM + abdominalMM + thighMM;
    const bodyDensity: number = 1.10938 - (0.0008267 * sumOfSkinFolds) + (0.0000016 * Math.pow(sumOfSkinFolds, 2)) - (0.0002574 * age);
    return bodyDensity;
  }

  calculateBodyFatPercentage(bodyDensity: number) {
    const bodyFatPercentage = (495 / bodyDensity) - 450;
    return bodyFatPercentage;
  }

  calculateValues() {
    console.log(this.form);
    const values = this.form.value;
    const bodyDensity = this.calculateBodyDensity(values.chest, values.abdominal, values.thigh, values.age);
    const bodyFatPercentage = this.calculateBodyFatPercentage(bodyDensity);
    const calculatedValues: StatisticsData = {
      timestamp: Date.now(), abdominal: values.abdominal, age: values.age, chest: values.chest, weight: values.weight, thigh: values.thigh,
      bodyDensity, bodyFatPercentage, bodyFat: values.weight * (bodyFatPercentage / 100),
      leanBodyMass: values.weight - (values.weight * (bodyFatPercentage / 100))
    };
    this.calculatedValues = calculatedValues;
  }

  addValues() {
    if (this.calculatedValues) {
      this.userData.push({...this.calculatedValues});
      this.form.reset();
      this.showChart();
      this.calculatedValues = null;
      this.updateFlag = true;
    }
  }

  showChart() {
    this.chartOptions.series = [];
    this.chartOptions.series.push({
      name: 'Lean Body Mass',
      data: this.userData.map(x => (
        [x.timestamp, x.leanBodyMass]
      )
      ),
      yAxis: 0,
    });
    this.chartOptions.series.push({
      name: 'Body Fat',
      data: this.userData.map(x => (
        [x.timestamp, x.bodyFat]
      )
      ),
      yAxis: 1,
    });
  }

}

interface StatisticsData {
  timestamp: number;
  chest: number;
  abdominal: number;
  thigh: number;
  age: number;
  bodyFatPercentage: number;
  bodyFat: number;
  bodyDensity: number;
  leanBodyMass: number;
  weight: number;
}
