import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Plus, Trash2, Edit, UserCog, Calendar } from "lucide-react";
import { toast } from "sonner";

type Assignment = {
  id: string;
  massDay: string;
  massTime: string;
  date: string;
  collectors: string[];
  lectors: string[];
  eucharisticMinisters: string[];
  altarServers: string[];
  choirLeader: string;
  ushers: string[];
};

const initialAssignments: Assignment[] = [
  {
    id: "1",
    massDay: "Sunday",
    massTime: "7:00 AM",
    date: "2024-04-07",
    collectors: ["Juan Santos", "Maria Cruz"],
    lectors: ["Ana Garcia", "Pedro Reyes"],
    eucharisticMinisters: ["Elena Santos", "Carlos Mendez", "Rosa Martinez"],
    altarServers: ["Miguel Jr.", "Juan Pablo", "Antonio"],
    choirLeader: "Ana Garcia",
    ushers: ["Roberto Cruz", "Felipe Santos", "Mario Reyes"],
  },
  {
    id: "2",
    massDay: "Sunday",
    massTime: "9:00 AM",
    date: "2024-04-07",
    collectors: ["Carlos Rodriguez", "Diana Santos"],
    lectors: ["Luis Mendoza", "Patricia Garcia"],
    eucharisticMinisters: ["Sandra Cruz", "Miguel Reyes", "Isabel Martinez"],
    altarServers: ["Paolo", "Marcus", "David"],
    choirLeader: "Teresa Santos",
    ushers: ["Antonio Cruz", "Jorge Santos", "Rafael Mendez"],
  },
  {
    id: "3",
    massDay: "Sunday",
    massTime: "5:00 PM",
    date: "2024-04-07",
    collectors: ["Youth Group A", "Youth Group B"],
    lectors: ["Sarah Cruz", "Mark Santos"],
    eucharisticMinisters: ["Anna Reyes", "Joseph Cruz", "Mary Santos"],
    altarServers: ["Gabriel", "Rafael", "Michael"],
    choirLeader: "Youth Choir Leader",
    ushers: ["Young Adults Ministry", "Teen Volunteers"],
  },
];

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ministryRoles = [
  "Collectors",
  "Lectors",
  "Eucharistic Ministers",
  "Altar Servers",
  "Choir Leader",
  "Ushers",
];

export function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<Partial<Assignment>>({
    massDay: "Sunday",
    massTime: "",
    date: "",
    collectors: [],
    lectors: [],
    eucharisticMinisters: [],
    altarServers: [],
    choirLeader: "",
    ushers: [],
  });

  // Temporary input states for multi-value fields
  const [collectorInput, setCollectorInput] = useState("");
  const [lectorInput, setLectorInput] = useState("");
  const [emInput, setEmInput] = useState("");
  const [serverInput, setServerInput] = useState("");
  const [usherInput, setUsherInput] = useState("");

  const handleSubmit = () => {
    if (!formData.massDay || !formData.massTime || !formData.date) {
      toast.error("Please fill all required fields");
      return;
    }

    if (editingAssignment) {
      setAssignments(
        assignments.map((a) =>
          a.id === editingAssignment.id ? { ...a, ...formData } as Assignment : a
        )
      );
      toast.success("Assignment updated successfully");
    } else {
      const newAssignment: Assignment = {
        id: Date.now().toString(),
        massDay: formData.massDay!,
        massTime: formData.massTime!,
        date: formData.date!,
        collectors: formData.collectors || [],
        lectors: formData.lectors || [],
        eucharisticMinisters: formData.eucharisticMinisters || [],
        altarServers: formData.altarServers || [],
        choirLeader: formData.choirLeader || "",
        ushers: formData.ushers || [],
      };
      setAssignments([...assignments, newAssignment]);
      toast.success("Assignment created successfully");
    }

    resetForm();
  };

  const resetForm = () => {
    setIsAddDialogOpen(false);
    setEditingAssignment(null);
    setFormData({
      massDay: "Sunday",
      massTime: "",
      date: "",
      collectors: [],
      lectors: [],
      eucharisticMinisters: [],
      altarServers: [],
      choirLeader: "",
      ushers: [],
    });
    setCollectorInput("");
    setLectorInput("");
    setEmInput("");
    setServerInput("");
    setUsherInput("");
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData(assignment);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setAssignments(assignments.filter((a) => a.id !== id));
    toast.success("Assignment deleted successfully");
  };

  const addToList = (key: keyof Assignment, value: string) => {
    if (!value.trim()) return;
    const currentList = (formData[key] as string[]) || [];
    setFormData({
      ...formData,
      [key]: [...currentList, value.trim()],
    });
  };

  const removeFromList = (key: keyof Assignment, index: number) => {
    const currentList = (formData[key] as string[]) || [];
    setFormData({
      ...formData,
      [key]: currentList.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{assignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{assignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Active Volunteers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">45</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Ministries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{ministryRoles.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Ministry Assignments
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAssignment ? "Edit Assignment" : "Create New Assignment"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAssignment 
                      ? "Update the mass assignment details below." 
                      : "Assign collectors and ministries to a mass schedule."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mass Day *</Label>
                      <Select
                        value={formData.massDay}
                        onValueChange={(value) =>
                          setFormData({ ...formData, massDay: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Mass Time *</Label>
                      <Input
                        type="time"
                        value={formData.massTime}
                        onChange={(e) =>
                          setFormData({ ...formData, massTime: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>

                  {/* Collectors */}
                  <div className="space-y-2">
                    <Label>Collectors</Label>
                    <div className="flex gap-2">
                      <Input
                        value={collectorInput}
                        onChange={(e) => setCollectorInput(e.target.value)}
                        placeholder="Enter name and press Add"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addToList("collectors", collectorInput);
                            setCollectorInput("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addToList("collectors", collectorInput);
                          setCollectorInput("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.collectors?.map((name, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {name}
                          <button
                            onClick={() => removeFromList("collectors", index)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Lectors */}
                  <div className="space-y-2">
                    <Label>Lectors</Label>
                    <div className="flex gap-2">
                      <Input
                        value={lectorInput}
                        onChange={(e) => setLectorInput(e.target.value)}
                        placeholder="Enter name and press Add"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addToList("lectors", lectorInput);
                            setLectorInput("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addToList("lectors", lectorInput);
                          setLectorInput("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.lectors?.map((name, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {name}
                          <button
                            onClick={() => removeFromList("lectors", index)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Eucharistic Ministers */}
                  <div className="space-y-2">
                    <Label>Eucharistic Ministers</Label>
                    <div className="flex gap-2">
                      <Input
                        value={emInput}
                        onChange={(e) => setEmInput(e.target.value)}
                        placeholder="Enter name and press Add"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addToList("eucharisticMinisters", emInput);
                            setEmInput("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addToList("eucharisticMinisters", emInput);
                          setEmInput("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.eucharisticMinisters?.map((name, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {name}
                          <button
                            onClick={() => removeFromList("eucharisticMinisters", index)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Altar Servers */}
                  <div className="space-y-2">
                    <Label>Altar Servers</Label>
                    <div className="flex gap-2">
                      <Input
                        value={serverInput}
                        onChange={(e) => setServerInput(e.target.value)}
                        placeholder="Enter name and press Add"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addToList("altarServers", serverInput);
                            setServerInput("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addToList("altarServers", serverInput);
                          setServerInput("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.altarServers?.map((name, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {name}
                          <button
                            onClick={() => removeFromList("altarServers", index)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Choir Leader */}
                  <div className="space-y-2">
                    <Label>Choir Leader</Label>
                    <Input
                      value={formData.choirLeader}
                      onChange={(e) =>
                        setFormData({ ...formData, choirLeader: e.target.value })
                      }
                      placeholder="Enter choir leader name"
                    />
                  </div>

                  {/* Ushers */}
                  <div className="space-y-2">
                    <Label>Ushers</Label>
                    <div className="flex gap-2">
                      <Input
                        value={usherInput}
                        onChange={(e) => setUsherInput(e.target.value)}
                        placeholder="Enter name and press Add"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addToList("ushers", usherInput);
                            setUsherInput("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addToList("ushers", usherInput);
                          setUsherInput("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.ushers?.map((name, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {name}
                          <button
                            onClick={() => removeFromList("ushers", index)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSubmit} className="w-full">
                    {editingAssignment ? "Update Assignment" : "Create Assignment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="border">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold">
                            {assignment.massDay}, {assignment.massTime}
                          </h4>
                          <Badge variant="outline">{assignment.date}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(assignment)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Collectors:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assignment.collectors.map((name, i) => (
                            <Badge key={i} variant="outline">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Lectors:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assignment.lectors.map((name, i) => (
                            <Badge key={i} variant="outline">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          Eucharistic Ministers:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assignment.eucharisticMinisters.map((name, i) => (
                            <Badge key={i} variant="outline">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Altar Servers:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assignment.altarServers.map((name, i) => (
                            <Badge key={i} variant="outline">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Choir Leader:</span>
                        <div className="mt-1">
                          <Badge variant="secondary">{assignment.choirLeader}</Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Ushers:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assignment.ushers.map((name, i) => (
                            <Badge key={i} variant="outline">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}