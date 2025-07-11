'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
export default function ConfigurationPage() {
    const [activeTab, setActiveTab] = useState('schedule');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    // Data states
    const [scheduleConfigs, setScheduleConfigs] = useState([]);
    const [periodConfigs, setPeriodConfigs] = useState([]);
    const [departmentConfigs, setDepartmentConfigs] = useState([]);
    const [loadLimitConfigs, setLoadLimitConfigs] = useState([]);
    const [constraintConfigs, setConstraintConfigs] = useState([]);
    // Form states
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [editingPeriod, setEditingPeriod] = useState(null);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [editingLoadLimit, setEditingLoadLimit] = useState(null);
    const [editingConstraint, setEditingConstraint] = useState(null);
    useEffect(() => {
        loadConfigurations();
    }, []);
    const loadConfigurations = async () => {
        try {
            setLoading(true);
            const [schedules, periods, departments, loadLimits, constraints] = await Promise.all([
                fetch('/api/admin/schedule-configs').then(r => r.json()),
                fetch('/api/admin/period-configs').then(r => r.json()),
                fetch('/api/admin/department-configs').then(r => r.json()),
                fetch('/api/admin/load-limit-configs').then(r => r.json()),
                fetch('/api/admin/constraint-configs').then(r => r.json())
            ]);
            setScheduleConfigs(schedules);
            setPeriodConfigs(periods);
            setDepartmentConfigs(departments);
            setLoadLimitConfigs(loadLimits);
            setConstraintConfigs(constraints);
        }
        catch (error) {
            console.error('Error loading configurations:', error);
            setMessage('Error loading configurations');
        }
        finally {
            setLoading(false);
        }
    };
    const saveConfiguration = async (type, data) => {
        try {
            setSaving(true);
            const response = await fetch(`/api/admin/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                setMessage('Configuration saved successfully');
                loadConfigurations();
                // Clear editing states
                setEditingSchedule(null);
                setEditingPeriod(null);
                setEditingDepartment(null);
                setEditingLoadLimit(null);
                setEditingConstraint(null);
            }
            else {
                setMessage('Error saving configuration');
            }
        }
        catch (error) {
            console.error('Error saving configuration:', error);
            setMessage('Error saving configuration');
        }
        finally {
            setSaving(false);
        }
    };
    const toggleActive = async (type, id, isActive) => {
        try {
            const response = await fetch(`/api/admin/${type}/${id}/toggle`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive })
            });
            if (response.ok) {
                loadConfigurations();
            }
        }
        catch (error) {
            console.error('Error toggling configuration:', error);
        }
    };
    if (loading) {
        return (<div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading configurations...</div>
        </div>
      </div>);
    }
    return (<div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">School Configuration</h1>
        <p className="text-muted-foreground">
          Configure your school's schedule types, periods, departments, load limits, and constraints.
        </p>
      </div>

      {message && (<Alert className="mb-6">
          <AlertDescription>{message}</AlertDescription>
        </Alert>)}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="schedule">Schedule Types</TabsTrigger>
          <TabsTrigger value="periods">Periods</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="load-limits">Load Limits</TabsTrigger>
          <TabsTrigger value="constraints">Constraints</TabsTrigger>
        </TabsList>

        {/* Schedule Types Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Schedule Types</h2>
            <Button onClick={() => setEditingSchedule({})}>
              Add Schedule Type
            </Button>
          </div>

          <div className="grid gap-4">
            {scheduleConfigs.map((config) => (<Card key={config.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.name}
                        <Badge variant={config.isActive ? "default" : "secondary"}>
                          {config.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingSchedule(config)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive('schedule-configs', config.id, !config.isActive)}>
                        {config.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <strong>Type:</strong> {config.type}
                  </div>
                  <div className="text-sm mt-2">
                    <strong>Configuration:</strong>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs">
                      {JSON.stringify(config.config, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>))}
          </div>

          {/* Schedule Type Form */}
          {editingSchedule && (<ScheduleTypeForm config={editingSchedule} onSave={(data) => saveConfiguration('schedule-configs', data)} onCancel={() => setEditingSchedule(null)} saving={saving}/>)}
        </TabsContent>

        {/* Periods Tab */}
        <TabsContent value="periods" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Periods</h2>
            <Button onClick={() => setEditingPeriod({})}>
              Add Period
            </Button>
          </div>

          <div className="grid gap-4">
            {periodConfigs.map((config) => (<Card key={config.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.name} ({config.label})
                        <Badge variant={config.isActive ? "default" : "secondary"}>
                          {config.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {config.startTime} - {config.endTime} ({config.duration} min)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingPeriod(config)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive('period-configs', config.id, !config.isActive)}>
                        {config.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Type:</strong> {config.type}</div>
                    <div><strong>Order:</strong> {config.order}</div>
                    <div><strong>Teaching:</strong> {config.isTeaching ? 'Yes' : 'No'}</div>
                    <div><strong>Coverable:</strong> {config.isCoverable ? 'Yes' : 'No'}</div>
                  </div>
                </CardContent>
              </Card>))}
          </div>

          {/* Period Form */}
          {editingPeriod && (<PeriodForm config={editingPeriod} onSave={(data) => saveConfiguration('period-configs', data)} onCancel={() => setEditingPeriod(null)} saving={saving}/>)}
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Departments</h2>
            <Button onClick={() => setEditingDepartment({})}>
              Add Department
            </Button>
          </div>

          <div className="grid gap-4">
            {departmentConfigs.map((config) => (<Card key={config.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.name} ({config.code})
                        <Badge variant={config.isActive ? "default" : "secondary"}>
                          {config.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Priority: {config.coveragePriority}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingDepartment(config)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive('department-configs', config.id, !config.isActive)}>
                        {config.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Same Dept Coverage:</strong> {config.sameDepartmentCoverage ? 'Yes' : 'No'}</div>
                    <div><strong>Cross Dept Coverage:</strong> {config.crossDepartmentCoverage ? 'Yes' : 'No'}</div>
                    <div><strong>Substitute Coverage:</strong> {config.substituteCoverage ? 'Yes' : 'No'}</div>
                  </div>
                </CardContent>
              </Card>))}
          </div>

          {/* Department Form */}
          {editingDepartment && (<DepartmentForm config={editingDepartment} onSave={(data) => saveConfiguration('department-configs', data)} onCancel={() => setEditingDepartment(null)} saving={saving}/>)}
        </TabsContent>

        {/* Load Limits Tab */}
        <TabsContent value="load-limits" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Load Limits</h2>
            <Button onClick={() => setEditingLoadLimit({})}>
              Add Load Limit
            </Button>
          </div>

          <div className="grid gap-4">
            {loadLimitConfigs.map((config) => (<Card key={config.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.name}
                        <Badge variant={config.isActive ? "default" : "secondary"}>
                          {config.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Type: {config.type}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingLoadLimit(config)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive('load-limit-configs', config.id, !config.isActive)}>
                        {config.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Max/Day:</strong> {config.maxPeriodsPerDay}</div>
                    <div><strong>Max/Week:</strong> {config.maxPeriodsPerWeek}</div>
                    <div><strong>Max Consecutive:</strong> {config.maxConsecutivePeriods}</div>
                    <div><strong>Min Prep/Day:</strong> {config.minPrepPeriodsPerDay}</div>
                  </div>
                </CardContent>
              </Card>))}
          </div>

          {/* Load Limit Form */}
          {editingLoadLimit && (<LoadLimitForm config={editingLoadLimit} onSave={(data) => saveConfiguration('load-limit-configs', data)} onCancel={() => setEditingLoadLimit(null)} saving={saving}/>)}
        </TabsContent>

        {/* Constraints Tab */}
        <TabsContent value="constraints" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Constraints</h2>
            <Button onClick={() => setEditingConstraint({})}>
              Add Constraint
            </Button>
          </div>

          <div className="grid gap-4">
            {constraintConfigs.map((config) => (<Card key={config.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.name}
                        <Badge variant={config.isActive ? "default" : "secondary"}>
                          {config.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{config.category}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingConstraint(config)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleActive('constraint-configs', config.id, !config.isActive)}>
                        {config.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Type:</strong> {config.ruleType}</div>
                    <div><strong>Priority:</strong> {config.priority}</div>
                    <div><strong>Enforced:</strong> {config.isEnforced ? 'Yes' : 'No'}</div>
                  </div>
                </CardContent>
              </Card>))}
          </div>

          {/* Constraint Form */}
          {editingConstraint && (<ConstraintForm config={editingConstraint} onSave={(data) => saveConfiguration('constraint-configs', data)} onCancel={() => setEditingConstraint(null)} saving={saving}/>)}
        </TabsContent>
      </Tabs>
    </div>);
}
// Form Components
function ScheduleTypeForm({ config, onSave, onCancel, saving }) {
    const [formData, setFormData] = useState(config);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (<Card>
      <CardHeader>
        <CardTitle>{config.id ? 'Edit' : 'Add'} Schedule Type</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required/>
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type || ''} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="traditional">Traditional</SelectItem>
                <SelectItem value="ab_days">A/B Days</SelectItem>
                <SelectItem value="block">Block Schedule</SelectItem>
                <SelectItem value="cycle">6-Day Cycle</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })}/>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>);
}
function PeriodForm({ config, onSave, onCancel, saving }) {
    const [formData, setFormData] = useState(config);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (<Card>
      <CardHeader>
        <CardTitle>{config.id ? 'Edit' : 'Add'} Period</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required/>
            </div>
            <div>
              <Label htmlFor="label">Label</Label>
              <Input id="label" value={formData.label || ''} onChange={(e) => setFormData({ ...formData, label: e.target.value })} required/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input id="startTime" type="time" value={formData.startTime || ''} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}/>
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input id="endTime" type="time" value={formData.endTime || ''} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}/>
            </div>
            <div>
              <Label htmlFor="duration">Duration (min)</Label>
              <Input id="duration" type="number" value={formData.duration || ''} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type || 'academic'} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="passing">Passing</SelectItem>
                  <SelectItem value="advisory">Advisory</SelectItem>
                  <SelectItem value="assembly">Assembly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="order">Order</Label>
              <Input id="order" type="number" value={formData.order || 0} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}/>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="isTeaching" checked={formData.isTeaching || false} onCheckedChange={(checked) => setFormData({ ...formData, isTeaching: checked })}/>
              <Label htmlFor="isTeaching">Teaching Period</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="isCoverable" checked={formData.isCoverable || false} onCheckedChange={(checked) => setFormData({ ...formData, isCoverable: checked })}/>
              <Label htmlFor="isCoverable">Coverable</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>);
}
function DepartmentForm({ config, onSave, onCancel, saving }) {
    const [formData, setFormData] = useState(config);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (<Card>
      <CardHeader>
        <CardTitle>{config.id ? 'Edit' : 'Add'} Department</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required/>
            </div>
            <div>
              <Label htmlFor="code">Code</Label>
              <Input id="code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required/>
            </div>
          </div>
          <div>
            <Label htmlFor="priority">Coverage Priority</Label>
            <Input id="priority" type="number" min="1" max="10" value={formData.coveragePriority || 1} onChange={(e) => setFormData({ ...formData, coveragePriority: parseInt(e.target.value) })}/>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="sameDepartmentCoverage" checked={formData.sameDepartmentCoverage || false} onCheckedChange={(checked) => setFormData({ ...formData, sameDepartmentCoverage: checked })}/>
              <Label htmlFor="sameDepartmentCoverage">Same Department Coverage</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="crossDepartmentCoverage" checked={formData.crossDepartmentCoverage || false} onCheckedChange={(checked) => setFormData({ ...formData, crossDepartmentCoverage: checked })}/>
              <Label htmlFor="crossDepartmentCoverage">Cross Department Coverage</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="substituteCoverage" checked={formData.substituteCoverage || false} onCheckedChange={(checked) => setFormData({ ...formData, substituteCoverage: checked })}/>
              <Label htmlFor="substituteCoverage">Substitute Coverage</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>);
}
function LoadLimitForm({ config, onSave, onCancel, saving }) {
    const [formData, setFormData] = useState(config);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (<Card>
      <CardHeader>
        <CardTitle>{config.id ? 'Edit' : 'Add'} Load Limit</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required/>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type || ''} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="substitute">Substitute</SelectItem>
                  <SelectItem value="paraprofessional">Paraprofessional</SelectItem>
                  <SelectItem value="department_head">Department Head</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxPeriodsPerDay">Max Periods/Day</Label>
              <Input id="maxPeriodsPerDay" type="number" value={formData.maxPeriodsPerDay || 6} onChange={(e) => setFormData({ ...formData, maxPeriodsPerDay: parseInt(e.target.value) })}/>
            </div>
            <div>
              <Label htmlFor="maxPeriodsPerWeek">Max Periods/Week</Label>
              <Input id="maxPeriodsPerWeek" type="number" value={formData.maxPeriodsPerWeek || 30} onChange={(e) => setFormData({ ...formData, maxPeriodsPerWeek: parseInt(e.target.value) })}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxConsecutivePeriods">Max Consecutive Periods</Label>
              <Input id="maxConsecutivePeriods" type="number" value={formData.maxConsecutivePeriods || 4} onChange={(e) => setFormData({ ...formData, maxConsecutivePeriods: parseInt(e.target.value) })}/>
            </div>
            <div>
              <Label htmlFor="minPrepPeriodsPerDay">Min Prep Periods/Day</Label>
              <Input id="minPrepPeriodsPerDay" type="number" value={formData.minPrepPeriodsPerDay || 1} onChange={(e) => setFormData({ ...formData, minPrepPeriodsPerDay: parseInt(e.target.value) })}/>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>);
}
function ConstraintForm({ config, onSave, onCancel, saving }) {
    const [formData, setFormData] = useState(config);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (<Card>
      <CardHeader>
        <CardTitle>{config.id ? 'Edit' : 'Add'} Constraint</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required/>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category || ''} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="union">Union</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ruleType">Rule Type</Label>
              <Select value={formData.ruleType || ''} onValueChange={(value) => setFormData({ ...formData, ruleType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rule type"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                  <SelectItem value="preference">Preference</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" type="number" min="1" max="10" value={formData.priority || 1} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}/>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required/>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="isEnforced" checked={formData.isEnforced || false} onCheckedChange={(checked) => setFormData({ ...formData, isEnforced: checked })}/>
            <Label htmlFor="isEnforced">Enforced</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>);
}
