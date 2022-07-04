package main

import (
	"context"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	_ "image/jpeg"
	"image/png"
	_ "image/png"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/image/draw"
)

var (
	ErrNoFileSelected = errors.New("no file selected")
	ErrInvalidQuality = errors.New("Compressed image Quality must be between 1 and 100")
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type FileInfo struct {
	Path        string    `json:"path"`
	Name        string    `json:"name"`
	ImageFormat string    `json:"image_format"`
	Size        int64     `json:"size"`
	Width       int       `json:"width"`
	Height      int       `json:"height"`
	ModTime     time.Time `json:"last_mod_time"`
}

func (a *App) SelectFile() (*FileInfo, error) {
	filename, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		// DefaultDirectory: "~/Downloads",
		Title: "Select a file to compress",
		Filters: []runtime.FileFilter{{
			DisplayName: "Image Files (*.jpg, *.png)",
			Pattern:     "*.jpg;*.png",
		}},
	})

	if err != nil {
		return nil, err
	}

	info, err := os.Stat(filename)
	if err != nil {
		return nil, err
	}

	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	image, format, err := image.DecodeConfig(file)
	if err != nil {
		return nil, err
	}

	return &FileInfo{
		Path:        filename,
		Name:        info.Name(),
		ImageFormat: format,
		Size:        info.Size(),
		Width:       image.Width,
		Height:      image.Height,
		ModTime:     info.ModTime(),
	}, nil
}

type CompressionOptions struct {
	OriginalFilePath string `json:"original_file_path"`
	OriginalFileName string `json:"original_file_name"`
	Quality          int    `json:"quality"` // Between 1 and 100
	MaxWidth         int    `json:"max_width"`
	MaxHeight        int    `json:"max_height"`
}

func (a *App) CompressFile(options CompressionOptions) error {
	if options.OriginalFilePath == "" {
		return ErrNoFileSelected
	}

	fileName := options.OriginalFileName
	if fileName == "" {
		fileName = filepath.Base(fileName)
	}

	extension := filepath.Ext(fileName)
	copyName := strings.TrimSuffix(fileName, extension) + "-compressed" + extension

	destination, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save to",
		DefaultFilename: copyName,
		Filters: []runtime.FileFilter{{
			DisplayName: "Image Files (*.jpg, *.png)",
			Pattern:     "*.jpg;*.png",
		}},
		CanCreateDirectories: true,
	})
	if err != nil {
		return err
	}

	if destination == "" {
		return nil
	}

	originalFile, err := os.Open(options.OriginalFilePath)
	if err != nil {
		return err
	}
	defer originalFile.Close()

	src, format, err := image.Decode(originalFile)
	if err != nil {
		return err
	}

	newFile, err := os.Create(destination)
	if err != nil {
		return err
	}
	defer newFile.Close()

	width, height := getImageDimensions(src, options.MaxWidth, options.MaxHeight)

	// Set the expected size that you want:
	dst := image.NewRGBA(image.Rect(0, 0, width, height))

	// Resize:
	draw.ApproxBiLinear.Scale(dst, dst.Rect, src, src.Bounds(), draw.Over, nil)

	switch format {
	case "jpeg":
		if options.Quality < 1 || options.Quality > 100 {
			return ErrInvalidQuality
		}

		err = jpeg.Encode(newFile, dst, &jpeg.Options{
			Quality: options.Quality,
		})
		if err != nil {
			return err
		}

	case "png":
		enc := &png.Encoder{
			CompressionLevel: png.BestCompression,
		}
		err = enc.Encode(newFile, dst)
		if err != nil {
			return err
		}
	}

	runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:    runtime.InfoDialog,
		Message: "File compressed",
	})

	return nil
}

func getImageDimensions(img image.Image, maxW, maxH int) (int, int) {
	currW := img.Bounds().Max.X - img.Bounds().Min.X
	currH := img.Bounds().Max.Y - img.Bounds().Min.Y

	ratioX := float64(currW) / float64(maxW) // 1000/500 = 2
	ratioY := float64(currH) / float64(maxH) // 1000/300 = 3.33

	// The image is the same or smaller
	if ratioX <= 1 && ratioY <= 1 {
		return currW, currH
	}

	// Use the bigger ratio
	if ratioX > ratioY {
		return int(float64(currW) / ratioX), int(float64(currH) / ratioX)
	}

	return int(float64(currW) / ratioY), int(float64(currH) / ratioY)
}
