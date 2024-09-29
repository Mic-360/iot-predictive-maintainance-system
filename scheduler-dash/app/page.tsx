'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { endpoint, modelName, token } from '@/lib/constant';
import {
  Drill,
  Gauge,
  Printer,
  Scissors,
  Search,
  Thermometer,
  Vibrate,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import OpenAI from 'openai';
import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

type BaseDeviceData = {
  device_id: string;
  device_type: string;
  temperature: number;
  vibration: number;
  power_consumption: number;
  timestamp: number;
};

type PrinterData = BaseDeviceData & {
  nozzle_temperature: number;
  bed_temperature: number;
  filament_flow_rate: number;
  print_speed: number;
  layer_height: number;
  extruder_position: number;
};

type CNCData = BaseDeviceData & {
  spindle_speed: number;
  feed_rate: number;
  cutting_depth: number;
  tool_wear: number;
  axis_position_x: number;
  axis_position_y: number;
  axis_position_z: number;
};

type DeviceData = PrinterData | CNCData;

type ExtendedChartConfig = ChartConfig & {
  nozzle_temperature?: {
    label: string;
    color: string;
  };
  bed_temperature?: {
    label: string;
    color: string;
  };
  spindle_speed?: {
    label: string;
    color: string;
  };
  feed_rate?: {
    label: string;
    color: string;
  };
};

const chartConfig: ExtendedChartConfig = {
  temperature: {
    label: 'Temperature',
    color: 'hsl(var(--chart-1))',
  },
  vibration: {
    label: 'Vibration',
    color: 'hsl(var(--chart-2))',
  },
  power_consumption: {
    label: 'Power Consumption',
    color: 'hsl(var(--chart-3))',
  },
  nozzle_temperature: {
    label: 'Nozzle Temperature',
    color: 'hsl(var(--chart-4))',
  },
  bed_temperature: {
    label: 'Bed Temperature',
    color: 'hsl(var(--chart-5))',
  },
  spindle_speed: {
    label: 'Spindle Speed',
    color: 'hsl(var(--chart-4))',
  },
  feed_rate: {
    label: 'Feed Rate',
    color: 'hsl(var(--chart-5))',
  },
};

export default function Home() {
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [analysisResult, setAnalysisResult] = useState('');
  const [dataCount, setDataCount] = useState(0);
  const [showNodeRed, setShowNodeRed] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:1880/ws');

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as DeviceData;
      console.log('Received device data:', data);
      setDeviceData((prevData) => {
        const newData = [...prevData, data];
        if (newData.length > 10) {
          newData.splice(0, newData.length - 10);
        }
        return newData;
      });
      setDataCount((prevCount) => prevCount + 1);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const memoizedPredictMaintenance = useCallback(async (data: DeviceData[]) => {
    try {
      const client = new OpenAI({
        baseURL: endpoint,
        apiKey: token,
        dangerouslyAllowBrowser: true,
      });

      const prompt = `Analyze the following data points for maintenance issues:
${JSON.stringify(data, null, 2)}

Provide a concise analysis in this format:

1. Critical Alerts:
   - List only values exceeding thresholds. Format: Device (ID) - Metric: Value

2. Key Recommendations:
   - List 2-3 most important actions for each device

3. Health Summary:
   - One-line status for each device: "Good", "Needs Attention", or "Critical"

Use these thresholds:
- Temperature: >70°C
- Vibration: >8
- Power Consumption: >900W
- Nozzle Temperature (3D Printer): >250°C
- Bed Temperature (3D Printer): >110°C
- Spindle Speed (CNC Machine): >20000 RPM
- Tool Wear (CNC Machine): >80%

Keep the analysis brief and actionable.`;

      const response = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant specialized in predictive maintenance.',
          },
          { role: 'user', content: prompt },
        ],
        model: modelName,
      });

      setAnalysisResult(response.choices[0].message.content || '');
    } catch (error) {
      console.error('Error in predictMaintenance:', error);
      setAnalysisResult('Error occurred while analyzing the data.');
    }
  }, []);

  useEffect(() => {
    if (dataCount === 10) {
      memoizedPredictMaintenance(deviceData);
      setDataCount(0);
    }
  }, [dataCount, deviceData, memoizedPredictMaintenance]);

  const getLatestDeviceData = (deviceType: string) => {
    return deviceData
      .filter((data) => data.device_type === deviceType)
      .slice(-1)[0];
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const renderNodeRedIframe = () => {
    return (
      <Card className='shadow-lg mb-6'>
        <CardHeader>
          <CardTitle className='text-2xl'>Node-RED Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='aspect-video'>
            <iframe
              src='http://localhost:1880/'
              className='w-full h-full border-0'
              title='Node-RED Dashboard'
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderQuickActions = () => {
    return (
      <Card className='shadow-lg mb-6'>
        <CardHeader>
          <CardTitle className='text-2xl'>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-4'>
          <Button onClick={() => setShowNodeRed(!showNodeRed)}>
            {showNodeRed ? 'Hide' : 'Show'} Node-RED Dashboard
          </Button>
          <Button onClick={() => memoizedPredictMaintenance(deviceData)}>
            Run Maintenance Prediction
          </Button>
          <Button onClick={() => setDeviceData([])}>Clear Data</Button>
        </CardContent>
      </Card>
    );
  };

  const renderDeviceChart = (
    deviceType: string,
    dataKey: keyof (DeviceData & PrinterData & CNCData)
  ) => {
    const data = deviceData
      .filter((d) => d.device_type === deviceType)
      .map((d) => ({
        value: (d as any)[dataKey],
        timestamp: formatTimestamp(d.timestamp),
      }));
    return (
      <ChartContainer
        config={chartConfig}
        className='h-[200px] w-full'
      >
        <ResponsiveContainer
          width='100%'
          height='100%'
        >
          <AreaChart
            data={data}
            accessibilityLayer
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='timestamp' />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type='monotone'
              dataKey='value'
              stroke={`var(--color-${dataKey})`}
              fill={`var(--color-${dataKey})`}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  };

  const renderDevicePanel = (deviceType: string) => {
    const latestData = getLatestDeviceData(deviceType);
    if (!latestData) return null;

    const isPrinter = deviceType === '3d_printer';

    return (
      <Card className='col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-gray-50'>
        <CardHeader className='bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-lg'>
          <CardTitle className='text-2xl flex items-center text-primary'>
            {isPrinter ? (
              <Printer className='mr-2 h-8 w-8' />
            ) : (
              <Scissors className='mr-2 h-8 w-8' />
            )}
            {isPrinter ? '3D Printer' : 'CNC Machine'}
          </CardTitle>
          <CardDescription className='font-medium'>
            Device ID: {latestData.device_id}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6 p-6'>
          {[
            {
              key: 'temperature',
              label: 'Temperature',
              unit: '°C',
              icon: Thermometer,
            },
            { key: 'vibration', label: 'Vibration', unit: '', icon: Vibrate },
            {
              key: 'power_consumption',
              label: 'Power Consumption',
              unit: 'W',
              icon: Zap,
            },
            ...(isPrinter
              ? [
                  {
                    key: 'nozzle_temperature',
                    label: 'Nozzle Temperature',
                    unit: '°C',
                    icon: Thermometer,
                  },
                  {
                    key: 'bed_temperature',
                    label: 'Bed Temperature',
                    unit: '°C',
                    icon: Thermometer,
                  },
                ]
              : [
                  {
                    key: 'spindle_speed',
                    label: 'Spindle Speed',
                    unit: 'RPM',
                    icon: Gauge,
                  },
                  {
                    key: 'feed_rate',
                    label: 'Feed Rate',
                    unit: 'mm/min',
                    icon: Gauge,
                  },
                ]),
          ].map(({ key, label, unit, icon: Icon }) => (
            <div
              key={key}
              className='space-y-2'
            >
              <div className='flex items-center justify-between'>
                <h4 className='text-lg font-semibold flex items-center'>
                  <Icon className='mr-2 h-5 w-5 text-primary' />
                  {label}
                </h4>
                <Badge
                  variant='outline'
                  className='text-sm font-medium'
                >
                  {(latestData as any)[key].toFixed(2)}
                  {unit}
                </Badge>
              </div>
              {renderDeviceChart(
                deviceType,
                key as keyof (DeviceData & PrinterData & CNCData)
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceCharts = (
    deviceType: '3d_printer' | 'cnc_machine'
  ) => {
    const data = deviceData.filter((d) => d.device_type === deviceType);
    const latestData = data[data.length - 1];

    if (!latestData) return null;

    const commonCharts = [
      { key: 'temperature', label: 'Temperature (°C)' },
      { key: 'vibration', label: 'Vibration' },
      { key: 'power_consumption', label: 'Power Consumption (W)' },
    ];

    const deviceSpecificCharts =
      deviceType === '3d_printer'
        ? [
            { key: 'nozzle_temperature', label: 'Nozzle Temperature (°C)' },
            { key: 'bed_temperature', label: 'Bed Temperature (°C)' },
          ]
        : [
            { key: 'spindle_speed', label: 'Spindle Speed (RPM)' },
            { key: 'tool_wear', label: 'Tool Wear (%)' },
          ];

    const allCharts = [...commonCharts, ...deviceSpecificCharts];

    return (
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
        {allCharts.map((chart, index) => (
          <Card
            key={index}
            className='w-full'
          >
            <CardHeader>
              <CardTitle>{chart.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className='h-[300px] w-[400px] xl:w-[600px]'
              >
                <ResponsiveContainer
                  width='100%'
                  height='100%'
                >
                  {index % 2 === 0 ? (
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis
                        dataKey='timestamp'
                        tickFormatter={(timestamp) =>
                          new Date(timestamp * 1000).toLocaleTimeString()
                        }
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type='monotone'
                        dataKey={chart.key}
                        stroke={`var(--color-${chart.key})`}
                        strokeWidth={2}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis
                        dataKey='timestamp'
                        tickFormatter={(timestamp) =>
                          new Date(timestamp * 1000).toLocaleTimeString()
                        }
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar
                        dataKey={chart.key}
                        fill={`var(--color-${chart.key})`}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderAnalysisHighlights = (
    deviceType: '3d_printer' | 'cnc_machine'
  ) => {
    if (!analysisResult) return null;

    const highlights = [
      {
        keyword: 'temperature',
        icon: <Thermometer className='h-5 w-5 text-red-500' />,
        color: 'bg-red-100 border-red-300',
        threshold: 70,
        unit: '°C',
      },
      {
        keyword: 'vibration',
        icon: <Vibrate className='h-5 w-5 text-yellow-500' />,
        color: 'bg-yellow-100 border-yellow-300',
        threshold: 8,
        unit: '',
      },
      {
        keyword: 'power consumption',
        icon: <Zap className='h-5 w-5 text-blue-500' />,
        color: 'bg-blue-100 border-blue-300',
        threshold: 900,
        unit: 'W',
      },
      {
        keyword: 'tool wear',
        icon: <Drill className='h-5 w-5 text-orange-500' />,
        color: 'bg-orange-100 border-orange-300',
        threshold: 80,
        unit: '%',
      },
    ];

    const criticalAlerts = analysisResult
      .split('1. Critical Alerts:')[1]
      .split('2. Key Recommendations:')[0]
      .trim()
      .split('\n');

    return criticalAlerts
      .map((alert, index) => {
        const matchingHighlight = highlights.find((h) =>
          alert.toLowerCase().includes(h.keyword)
        );
        if (matchingHighlight) {
          const [device, metric, value] = alert.split('-').map((s) => s.trim());
          const [numericValue] = value.match(/\d+(\.\d+)?/) || [''];
          const parsedValue = parseFloat(numericValue);

          return (
            <Alert
              key={index}
              className={`${matchingHighlight.color} border animate-pulse`}
            >
              {matchingHighlight.icon}
              <AlertTitle className='text-lg font-semibold'>
                {device}: Critical{' '}
                {matchingHighlight.keyword.charAt(0).toUpperCase() +
                  matchingHighlight.keyword.slice(1)}
              </AlertTitle>
              <AlertDescription>
                Current value: {parsedValue.toFixed(2)}
                {matchingHighlight.unit}
                (Threshold: {matchingHighlight.threshold}
                {matchingHighlight.unit})
              </AlertDescription>
            </Alert>
          );
        }
        return null;
      })
      .filter(Boolean);
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    const customRenderers: Partial<Components> = {
      h3: ({ children }) => (
        <h3 className='text-xl font-bold mt-6 mb-3 text-primary'>{children}</h3>
      ),
      p: ({ children }) => <p className='mb-2'>{children}</p>,
      ul: ({ children }) => (
        <ul className='list-disc list-inside mb-4'>{children}</ul>
      ),
      li: ({ children }) => <li className='mb-1'>{children}</li>,
      strong: ({ children }) => (
        <strong className='font-semibold text-primary'>{children}</strong>
      ),
    };

    return (
      <Card className='w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden'>
        <CardHeader className='bg-primary text-white'>
          <CardTitle className='text-2xl font-bold'>
            Maintenance Prediction Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6'>
          <ReactMarkdown components={customRenderers}>
            {analysisResult}
          </ReactMarkdown>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className='min-h-screen bg-transparent'>
      <header className='bg-white shadow-md sticky top-0 z-10'>
        <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Image
              src='/logo.svg'
              alt='Logo'
              width={72}
              height={72}
            />
            <div className='flex flex-col items-start'>
              <h1 className='text-2xl font-bold text-gray-800'>
                Smart Predictive Maintenance Dashboard{' '}
              </h1>
              <p className='text-gray-400 text-xs pl-3'>
                powered by {modelName.toUpperCase()}
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-4'>
            <Input
              className='w-64'
              type='text'
              placeholder='Search...'
            />
            <Button
              variant='ghost'
              size='icon'
            >
              <Search className='h-5 w-5' />
              <span className='sr-only'>Search</span>
            </Button>
          </div>
        </div>
      </header>

      <main className='container mx-auto p-4 space-y-8'>
        {renderQuickActions()}
        {showNodeRed && renderNodeRedIframe()}
        {renderAnalysisResult()}

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {renderDevicePanel('3d_printer')}
          {renderDevicePanel('cnc_machine')}
        </div>

        <Card className='shadow-lg'>
          <CardHeader>
            <CardTitle className='text-2xl'>Recent Device Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Vibration</TableHead>
                    <TableHead>Power</TableHead>
                    <TableHead>Additional Info</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deviceData.slice(-5).map((data, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge
                          variant={
                            data.device_type === 'cnc_machine'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {data.device_type === 'cnc_machine' ? 'CNC' : '3D'}
                        </Badge>
                      </TableCell>
                      <TableCell>{data.device_id}</TableCell>
                      <TableCell>{formatTimestamp(data.timestamp)}</TableCell>
                      <TableCell>{data.temperature.toFixed(2)}°C</TableCell>
                      <TableCell>{data.vibration.toFixed(2)}</TableCell>
                      <TableCell>
                        {data.power_consumption.toFixed(2)}W
                      </TableCell>
                      <TableCell>
                        {data.device_type === '3d_printer' ? (
                          <>
                            Nozzle:{' '}
                            {(data as PrinterData).nozzle_temperature.toFixed(
                              2
                            )}
                            °C
                          </>
                        ) : (
                          <>
                            Spindle:{' '}
                            {(data as CNCData).spindle_speed.toFixed(2)} RPM
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue='3d'>
          <TabsList className='grid w-full grid-cols-2 shadow-md'>
            <TabsTrigger value='3d'>3D Printer</TabsTrigger>
            <TabsTrigger value='cnc'>CNC Machine</TabsTrigger>
          </TabsList>
          <TabsContent value='3d'>
            <Card className='shadow-lg'>
              <CardHeader>
                <CardTitle className='text-2xl'>3D Printer Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {renderAnalysisHighlights('3d_printer')}
                </div>
                {renderPerformanceCharts('3d_printer')}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent
            value='cnc'
            className='shadow-lg'
          >
            <Card className='shadow-lg'>
              <CardHeader>
                <CardTitle className='text-2xl'>CNC Machine Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {renderAnalysisHighlights('cnc_machine')}
                </div>
                {renderPerformanceCharts('cnc_machine')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
