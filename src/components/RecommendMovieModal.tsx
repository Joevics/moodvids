
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Movie } from "@/types/movie";
import { useTopPicks } from "@/hooks/useTopPicks";

const formSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(300, "Comment must be 300 characters or less").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RecommendMovieModalProps {
  movie: Movie;
  afterAdd?: () => void;
}

export const RecommendMovieModal = ({ movie, afterAdd }: RecommendMovieModalProps) => {
  const { addTopPick } = useTopPicks();
  const [open, setOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    await addTopPick.mutateAsync({
      movie,
      rating: values.rating,
      comment: values.comment,
    });
    
    setOpen(false);
    if (afterAdd) afterAdd();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Recommend Movie</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recommend "{movie.title}"</DialogTitle>
          <DialogDescription>
            Rate this movie and add a comment to recommend it to other users.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 cursor-pointer transition-colors ${
                            star <= field.value 
                              ? "text-yellow-400 fill-yellow-400" 
                              : "text-muted-foreground"
                          }`}
                          onClick={() => form.setValue("rating", star)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    How would you rate this movie?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your thoughts on this movie..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your comment will be visible to other users.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={addTopPick.isPending}
              >
                {addTopPick.isPending ? "Recommending..." : "Recommend"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
